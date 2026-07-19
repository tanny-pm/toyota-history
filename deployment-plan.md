# トヨタ車 系譜ビューア ― デプロイ / 開発セットアップ計画

> 開発着手前に決めた技術・デプロイ方針をまとめたもの。
> デザインモック（別エージェント制作の HTML/CSS）を土台に、React アプリとして実装し GitHub Pages に公開する。

---

## 1. 確定した決定一覧

| 項目            | 決定                                                                                   |
| --------------- | -------------------------------------------------------------------------------------- |
| フレームワーク  | React + **Vite+** + TypeScript                                                         |
| スタイリング    | **Tailwind CSS**                                                                       |
| Lint / 整形     | **Oxlint（`vp lint`）＋ Oxfmt（`vp fmt`）** ※Vite+ 標準。ESLint/Prettier は使わない    |
| テスト          | **Vitest（`vp test`）を完全セットアップ**（設定＋サンプルテスト＋CI 実行）             |
| PM / ランタイム | **Vite+ が統合管理**（`vp install`。npm を基盤として自動検出）                         |
| ホスティング    | **GitHub Pages（プロジェクトサイト）**                                                 |
| リポジトリ      | `tanny-pm/toyota-history`（**public**）                                                |
| 公開URL         | `https://tanny-pm.github.io/toyota-history/`                                           |
| Vite `base`     | `'/toyota-history/'`                                                                   |
| デプロイ        | **GitHub Actions**（`actions/deploy-pages`、`main` push で自動、build は Vite+）       |
| ルーティング    | React Router、`basename = import.meta.env.BASE_URL` ＋ **404.html SPA フォールバック** |
| データ          | リポジトリ内の**静的 TS/JSON**（バックエンドなし）                                     |
| 版固定          | CI で **Node 22 LTS 固定** ＋ **Vite+ のバージョンをロック**（ベータ級ツールのため）   |

---

## 2. Vite+ とは（前提の共有）

Vite+（`vite-plus`、CLI は `vp`）は VoidZero の統合ツールチェーン。Vite / Vitest / Oxlint / Oxfmt / Rolldown / tsdown / タスクランナー、およびランタイム・パッケージマネージャ管理を1つの入口に束ねたもの。

主要コマンド:

| コマンド              | 用途                                        |
| --------------------- | ------------------------------------------- |
| `vp create`           | テンプレートから新規プロジェクト作成        |
| `vp install` (`vp i`) | 依存インストール（PM 自動検出）             |
| `vp dev`              | 開発サーバ（HMR）                           |
| `vp check`            | 整形・Lint・型チェックを一括実行            |
| `vp lint` / `vp fmt`  | Oxlint / Oxfmt                              |
| `vp test`             | Vitest でテスト                             |
| `vp build`            | 本番ビルド（Vite + Rolldown、`dist/` 出力） |
| `vp preview`          | 本番ビルドのプレビュー                      |

設定は `vite.config.ts` に集約し、`vite-plus` の `defineConfig` を使う（Vite / Vitest / Oxlint / Oxfmt / Task の設定を1ファイルに統合）。

> ⚠️ Vite+ は比較的新しいツールチェーン。**バージョンをロックし、ローカルと CI で同一版を使う**こと。CLI 名やフラグは公式ドキュメントで最新を確認する（本書のコマンドは執筆時点のもの）。

---

## 3. 前提条件

- GitHub アカウント `tanny-pm`（`gh` 認証済み・`repo` / `workflow` スコープあり）
- Node 22 LTS（ローカル開発。CI も 22 に固定）
- Vite+ のインストール（下記いずれか）
  - グローバル: `curl -fsSL https://vite.plus | bash`
  - プロジェクト devDep: `npm install -D vite-plus @voidzero-dev/vite-plus-core@latest`（CI ではこちらを使い、版を lockfile で固定）

---

## 4. セットアップ手順

### 4.1 プロジェクト作成とリポジトリ

```bash
# プロジェクト雛形（React + TS テンプレート）
vp create        # → React / TypeScript を選択

# 依存インストール
vp install

# Git 初期化＆リモート作成（public）
git init
gh repo create tanny-pm/toyota-history --public --source=. --remote=origin
```

### 4.2 Tailwind CSS 導入

- Tailwind を devDep で追加し、`tailwind.config` の `content` に `./index.html` と `./src/**/*.{ts,tsx}` を指定。
- エントリ CSS に Tailwind ディレクティブを読み込む。
- **注意**: 別エージェントのモックは素の HTML/CSS。Tailwind 採用のため、モックの CSS は*そのまま流用ではなくユーティリティクラスへ組み直す*（レイアウト・配色・余白の値はモックから流用する）。

### 4.3 Vite 設定（base パス）

`vite.config.ts`:

```ts
import { defineConfig } from "vite-plus";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/toyota-history/", // ← プロジェクトサイトの公開パス
  plugins: [react()],
  // test: { ... }  // Vitest 設定もここに統合
});
```

### 4.4 ルーティング（React Router + base）

- `basename` は base パスから導出（ハードコードしない）:

```tsx
import { createBrowserRouter } from "react-router-dom";

export const router = createBrowserRouter(routes, {
  basename: import.meta.env.BASE_URL, // '/toyota-history/'
});
```

### 4.5 404.html SPA フォールバック（GitHub Pages 用）

GitHub Pages はサーバ側フォールバックが無いため、`/toyota-history/car/xxx` を直リンク/リロードすると 404 になる。spa-github-pages 方式で回避:

1. **`public/404.html`** を用意し、アクセスされたパスをクエリに載せて `index.html` にリダイレクトするスクリプトを入れる（サブパス配下用に `pathSegmentsToKeep = 1`）。
2. **`index.html`** に、そのクエリを `history.replaceState` で本来のパスへ復元するスニペットを入れる。
3. ビルド後、`dist/404.html` が生成されることを確認（`public/` 配下は Vite がそのまま `dist/` へコピー）。

> 参考実装: rafgraph/spa-github-pages。

### 4.6 データ層

- `src/data/` に**型付き TS もしくは JSON** で車種・諸元・系譜（親子関係）を定義。
- 型定義例: `Model`（ネームプレート）/ `Generation`（世代・年式・諸元）/ 親子リンク / `isCurrent`（現行フラグ）。
- バックエンドなし。ビルド時にバンドルされる。

---

## 5. GitHub Actions ワークフロー（`.github/workflows/deploy.yml`）

`package.json` の scripts を Vite+ に対応させておく（`"dev":"vp dev"`, `"build":"vp build"`, `"check":"vp check"`, `"test":"vp test"`）。

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22" # LTS 固定
      - run: npm ci # vite-plus は devDep として lockfile で版固定
      - run: npm run check # vp check（整形・Lint・型）
      - run: npm test # vp test（Vitest）※CI は run-once モードで
      - run: npm run build # vp build → dist/
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- リポジトリ設定 → **Settings > Pages > Source を「GitHub Actions」** に切り替える（初回のみ）。
- `vp test` は CI（非対話）で1回実行して終了するモードにする（`CI=true` 環境変数、または run-once 相当のフラグ。**正確な指定は Vite+ ドキュメントで確認**）。

---

## 6. Vite+ 固有の注意

- **版固定が最重要**: `vite-plus` / `@voidzero-dev/vite-plus-core` を lockfile で固定し、ローカルと CI を一致させる。破壊的変更に備える。
- CLI・フラグ・テンプレ名は変わりうる。本書のコマンドは目安。**着手時に公式ドキュメントで最新を確認**。
- Lint/整形は Oxlint/Oxfmt に一本化（ESLint/Prettier の設定・依存は入れない）。エディタ拡張も Oxc 系に合わせる。

---

## 7. 落とし穴チェックリスト

- [ ] `vite.config.ts` の `base` が `'/toyota-history/'`（末尾スラッシュ必須）。
- [ ] Router の `basename` を `import.meta.env.BASE_URL` から取っている（`'/'` 決め打ちしていない）。
- [ ] 画像・リンク・fetch のパスを絶対 `/…` で書かず、`import.meta.env.BASE_URL` 基準にしている。
- [ ] `public/404.html` があり、ビルド後 `dist/404.html` が出力される。直リンク/リロードで 404 にならない。
- [ ] Settings > Pages の Source が「GitHub Actions」。
- [ ] Actions の permissions に `pages: write` と `id-token: write` がある。
- [ ] リポジトリは public（無料 Pages の条件）。
- [ ] `vite-plus` の版が lockfile で固定され、CI の Node が 22 に固定されている。
- [ ] CI で `vp test` が1回実行で終了する（watch で固まらない）。

---

## 8. 未確定・後続で決めること（スコープ外）

- カスタムドメインの採否（今回は使わない。使うなら `base:'/'` ＋ `CNAME` に変更）。
- 実データ（正確な車種・諸元）の投入方針。まずはダミー、後で `src/data/` を差し替え。
- 車種詳細ページの有無・URL 設計の詳細（Router 構成）。
- OGP / SEO / アナリティクスの導入。
