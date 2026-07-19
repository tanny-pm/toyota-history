// data/lineup.json の各車種について、日本語版 Wikipedia の記事本文を取得し
// data/raw/<wikipediaTitle>.txt に保存する。決定的・キャッシュ用途。
//
// 依存ゼロ（Node 標準の node:https / node:fs のみ）。外部パッケージは足さない。
// これは「取得」ステップ専用で、諸元の「抽出」はしない（抽出は rebuild-specs スキルで
// Claude Code 自身が data/raw/*.txt を読んで行う）。
//
// 使い方:
//   node scripts/fetch-wikipedia.mjs            … 全車種を取得
//   node scripts/fetch-wikipedia.mjs クラウン    … 名前 or 記事タイトル一致のみ取得（試走用）

import { get } from "node:https";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const LINEUP_PATH = join(ROOT, "data", "lineup.json");
const RAW_DIR = join(ROOT, "data", "raw");

// Wikipedia API は説明的な User-Agent を要求する（無指定だとブロックされ得る）。
const USER_AGENT =
  "toyota-history-datapipeline/1.0 (https://github.com/tanny-pm/toyota-history; educational demo)";

/** 1つの URL を GET して本文文字列を返す（リダイレクトを追う）。 */
function fetchText(url, redirects = 3) {
  return new Promise((resolve, reject) => {
    const req = get(url, { headers: { "User-Agent": USER_AGENT } }, (res) => {
      const { statusCode = 0, headers } = res;
      // HTTP リダイレクト対応
      if (statusCode >= 300 && statusCode < 400 && headers.location) {
        res.resume();
        if (redirects <= 0) {
          reject(new Error(`リダイレクト回数超過: ${url}`));
          return;
        }
        const next = new URL(headers.location, url).toString();
        resolve(fetchText(next, redirects - 1));
        return;
      }
      if (statusCode < 200 || statusCode >= 300) {
        res.resume();
        reject(new Error(`HTTP ${statusCode}: ${url}`));
        return;
      }
      res.setEncoding("utf8");
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => resolve(body));
    });
    req.on("error", reject);
    req.setTimeout(30000, () => req.destroy(new Error(`タイムアウト: ${url}`)));
  });
}

/** 記事タイトルから API URL を組み立てる。 */
function apiUrl(title) {
  const params = new URLSearchParams({
    action: "query",
    prop: "extracts",
    explaintext: "1",
    // 記事全文を1ページとして受け取る（section 分割なし）
    format: "json",
    redirects: "1", // タイトルがリダイレクトでも実記事へ解決させる
    titles: title,
  });
  return `https://ja.wikipedia.org/w/api.php?${params.toString()}`;
}

/** API レスポンス JSON から記事本文（extract）を取り出す。 */
function extractFromResponse(json, title) {
  const pages = json?.query?.pages;
  if (!pages) throw new Error(`予期しないレスポンス形状: ${title}`);
  const page = Object.values(pages)[0];
  if (!page || page.missing !== undefined || page.pageid === undefined) {
    throw new Error(`記事が見つからない: ${title}`);
  }
  const extract = page.extract;
  if (typeof extract !== "string" || extract.trim() === "") {
    throw new Error(`本文が空: ${title}`);
  }
  return extract;
}

/** ファイル名に使えない文字を避ける（curated タイトルなので通常は無変換）。 */
function safeFileName(title) {
  return title.replace(/[/\\]/g, "_");
}

/** 1車種を取得して data/raw/<title>.txt に保存。 */
async function fetchOne(vehicle) {
  const { name, wikipediaTitle } = vehicle;
  const json = JSON.parse(await fetchText(apiUrl(wikipediaTitle)));
  const extract = extractFromResponse(json, wikipediaTitle);
  const outPath = join(RAW_DIR, `${safeFileName(wikipediaTitle)}.txt`);
  // 末尾改行を1つに正規化して決定的に書き出す
  writeFileSync(outPath, extract.replace(/\s*$/, "") + "\n", "utf8");
  console.log(
    `✓ ${name}（${wikipediaTitle}）→ data/raw/${safeFileName(wikipediaTitle)}.txt（${extract.length} 文字）`,
  );
}

async function main() {
  const filter = process.argv[2]; // 任意: 名前 or 記事タイトルで絞り込み
  const lineup = JSON.parse(await readFile(LINEUP_PATH, "utf8"));
  let vehicles = lineup.vehicles ?? [];
  if (filter) {
    vehicles = vehicles.filter((v) => v.name === filter || v.wikipediaTitle === filter);
    if (vehicles.length === 0) {
      console.error(`該当する車種がない: "${filter}"`);
      process.exit(1);
    }
  }

  mkdirSync(RAW_DIR, { recursive: true });

  let failed = 0;
  for (const vehicle of vehicles) {
    try {
      await fetchOne(vehicle);
    } catch (err) {
      failed++;
      console.error(`✗ ${vehicle.name}（${vehicle.wikipediaTitle}）: ${err.message}`);
    }
    // Wikipedia への礼儀としてリクエスト間に小休止
    await new Promise((r) => setTimeout(r, 500));
  }

  if (failed > 0) {
    console.error(`\n${failed} 件失敗しました。`);
    process.exit(1);
  }
  console.log(`\n完了: ${vehicles.length} 件取得。`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
