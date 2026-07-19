// data/lineup.json の各車種について、トヨタ公式サイト（toyota.jp）の主要諸元 PDF を取得し
// data/raw/<車名>_spec.pdf に保存する。決定的・キャッシュ用途。
//
// 依存ゼロ（Node 標準の node:https / node:fs のみ）。外部パッケージは足さない。curl も使わない。
// これは「取得」ステップ専用で、諸元の「抽出」はしない（抽出は rebuild-specs スキルで
// Claude Code 自身が data/raw/*.pdf を Read して行う）。
//
// 取得フロー（車種ごと）:
//   1. 車種の諸元ページ HTML を取得（諸元 PDF は /<slug>/specification/ に載る。
//      念のため /<slug>/ トップにもフォールバックする）
//   2. 本文から /pages/contents/<modelSlug>/..._spec_<YYYYMM>.pdf のパスを正規表現で抽出
//      （日付 YYYYMM はハードコードせず動的に拾う。複数あれば最新月を採用）
//   3. https://toyota.jp + そのパス を取得し data/raw/<車名>_spec.pdf に保存
//
// 使い方:
//   node scripts/fetch-toyota.mjs            … 全車種を取得
//   node scripts/fetch-toyota.mjs クラウン    … 名前一致のみ取得（試走用）

import { get } from "node:https";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const LINEUP_PATH = join(ROOT, "data", "lineup.json");
const RAW_DIR = join(ROOT, "data", "raw");
const ORIGIN = "https://toyota.jp";

// ブラウザ風の User-Agent（公式サイトは無指定だとブロックし得る）。
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

/** 1つの URL を GET してレスポンス本文を Buffer で返す（リダイレクトを追う）。 */
function httpGet(url, redirects = 5) {
  return new Promise((resolve, reject) => {
    const req = get(
      url,
      {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "*/*",
        },
      },
      (res) => {
        const { statusCode = 0, headers } = res;
        // HTTP リダイレクト対応
        if (statusCode >= 300 && statusCode < 400 && headers.location) {
          res.resume();
          if (redirects <= 0) {
            reject(new Error(`リダイレクト回数超過: ${url}`));
            return;
          }
          const next = new URL(headers.location, url).toString();
          resolve(httpGet(next, redirects - 1));
          return;
        }
        if (statusCode < 200 || statusCode >= 300) {
          res.resume();
          reject(new Error(`HTTP ${statusCode}: ${url}`));
          return;
        }
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks)));
      },
    );
    req.on("error", reject);
    req.setTimeout(30000, () => req.destroy(new Error(`タイムアウト: ${url}`)));
  });
}

/**
 * 車種ページの HTML から諸元 PDF のパスを抽出する。
 * /pages/contents/<slug>/..._spec_<YYYYMM>.pdf を全て拾い、YYYYMM が最新のものを返す。
 */
function extractSpecPdfPath(html, slug) {
  // slug を正規表現に埋めるためエスケープ
  const escaped = slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`/pages/contents/${escaped}/[^"'\\s)]*?_spec_(\\d{6})\\.pdf`, "g");
  const found = new Map(); // path -> YYYYMM(number)
  for (const m of html.matchAll(re)) {
    found.set(m[0], Number(m[1]));
  }
  if (found.size === 0) {
    throw new Error(`諸元 PDF のパスが見つからない（slug=${slug}）`);
  }
  // 最新月（YYYYMM 最大）を採用。決定的にするためタイ時はパス名でソート。
  const best = [...found.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0];
  return best[0];
}

/**
 * 諸元 PDF のパスを探す。諸元ページ（/<slug>/specification/）を主に見て、
 * 見つからなければトップ（/<slug>/）にフォールバックする。
 */
async function findSpecPdfPath(modelSlug) {
  const candidates = [`${ORIGIN}/${modelSlug}/specification/`, `${ORIGIN}/${modelSlug}/`];
  let lastErr;
  for (const url of candidates) {
    try {
      const html = (await httpGet(url)).toString("utf8");
      return extractSpecPdfPath(html, modelSlug);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr ?? new Error(`諸元ページを取得できない（slug=${modelSlug}）`);
}

/** 1車種を取得して data/raw/<車名>_spec.pdf に保存。 */
async function fetchOne(vehicle) {
  const { name, modelSlug } = vehicle;
  const pdfPath = await findSpecPdfPath(modelSlug);
  const pdfUrl = ORIGIN + pdfPath;
  const pdf = await httpGet(pdfUrl);
  // PDF らしさの簡易チェック（HTML エラーページを掴んでいないか）
  if (pdf.subarray(0, 5).toString("latin1") !== "%PDF-") {
    throw new Error(`PDF ではない応答: ${pdfUrl}`);
  }
  const outPath = join(RAW_DIR, `${name}_spec.pdf`);
  writeFileSync(outPath, pdf);
  const month = pdfPath.match(/_spec_(\d{6})\.pdf/)?.[1] ?? "?";
  console.log(
    `✓ ${name}（${modelSlug}）→ data/raw/${name}_spec.pdf（${(pdf.length / 1024).toFixed(0)}KB, ${month} 版）`,
  );
}

async function main() {
  const filter = process.argv[2]; // 任意: 車名で絞り込み
  const lineup = JSON.parse(await readFile(LINEUP_PATH, "utf8"));
  let vehicles = lineup.vehicles ?? [];
  if (filter) {
    vehicles = vehicles.filter((v) => v.name === filter || v.modelSlug === filter);
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
      console.error(`✗ ${vehicle.name}（${vehicle.modelSlug}）: ${err.message}`);
    }
    // 公式サイトへの礼儀としてリクエスト間に小休止
    await new Promise((r) => setTimeout(r, 800));
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
