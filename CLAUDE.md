# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 応答言語

**このリポジトリでの Claude セッションでは、すべて日本語で応答すること。** UI テキストおよびコード内コメントも日本語で記述する（既存コードもすべて日本語）。編集時はこの慣習に合わせること。

## 概要

トヨタ車の系譜を可視化する単一ページの静的サイト。ネームプレート／世代を横軸タイムラインの樹形図で示し、あわせて諸元比較表を表示する。もとは自己完結型の Claude Design HTML モック（`系譜ビューア.dc.html`）で、それを React へ移植したもの。データは意図的にダミー（考証用ではない）で、バックエンド・ルーティング・実データ連携はない。元のデザイン仕様は `prototype-brief.md`（日本語）を参照。

## コマンド

ツールチェーンは素の Vite ではなく **vite-plus**（`vp`）。npm スクリプトが `vp` をラップしているので、常にスクリプト経由で実行すること。

- `npm run dev` — 開発サーバ
- `npm run build` — `dist/` へ本番ビルド
- `npm run check` — 品質ゲート一式: フォーマットチェック + Lint（oxlint）+ `tsc --noEmit`。プリコミットフックと CI が実行するもの。コミット前に実行すること。
- `npm run typecheck` — 型チェックのみ（`tsc --noEmit`）
- `npm run lint` / `npm run fmt` — oxlint / フォーマッタ
- `npm test` — vitest を1回実行（`vp test run`）
- `npm run test:watch` — vitest のウォッチモード
- 単一ファイル実行: `npm test -- src/lineage/lineageModel.test.ts`、名前指定: `npm test -- -t "現行ノード"`

Lint の抑制は oxlint 構文を使う。例: `// oxlint-disable-next-line typescript/no-explicit-any`

プリコミットフック（`.githooks/pre-commit`）は依存ゼロで、`npm install` 時に `prepare` スクリプトが `core.hooksPath=.githooks` を設定して有効化される。

## アーキテクチャ

中心となる設計は「**データは `data/*.json`、1つの純粋関数がそれを描画用に変換し、コンポーネントは描画するだけ**」。

- **データ層（`data/*.json` ＋ `src/data/`）** — 実データは3レイヤの JSON に分離（`real-data-plan.md` に全体設計）。`data/genealogy.json`（手書き：系譜ツリー）、`data/lineup.json`（手書き：諸元の列定義＋現行車種マニフェスト）、`data/specs.json`（機械生成：数値ネイティブの諸元）。型は `src/data/types.ts`（唯一の契約）。`src/data/index.ts` が JSON をビルド時に**静的 import** して型付きで再エクスポート（実行時 fetch なし）。`src/data/dataIntegrity.test.ts` が手書き層と生成層の整合（対応・型・派生の親の存在）を検査し、壊れたデータを `npm run check` / CI で落とす。

- **`src/lineage/lineageModel.ts`** — `buildLineageView(genealogy, lineup, specs)` は純粋・決定的な関数（React にもプロップスにも依存しない）で、データを**引数で受け取り** `LineageView` を返す。中身はジオメトリ全般（タイムラインの x/y 座標、SVG コネクタのパス、ノード座標、系譜の縦位置＝配列順から算出）と各要素の**完成済みインライン CSS 文字列**の生成。デザインモックの `renderVals()` を移植したもの。レイアウトとスタイリングのロジック（諸元表の列ごとの最大/最小ハイライト、単位付与、桁区切りなど）の唯一の正となる場所であり、ユニットテストされている対象でもある。**データ本体はここには無い**（`data/*.json` にある）。

- **諸元パイプライン（`scripts/fetch-wikipedia.mjs` ＋ `.claude/skills/rebuild-specs/`）** — `data/specs.json` は Wikipedia 由来の実データで都度再生成する（定期自動化はしない）。取得（依存ゼロの node スクリプト → `data/raw/` にキャッシュ）と抽出（`/rebuild-specs` スキル起動で Claude Code 自身が本文から `VehicleSpecs` スキーマへ構造化）を分離。位置づけは「リアルなデモ」で、Wikipedia を一旦信頼し正確性の考証は課さない。

- **`src/components/*`** — 薄い描画専用。`App.tsx` が `buildLineageView()` を一度だけ呼び、`view` を `GenealogySection`（タイムライン樹形図）と `CompareSection`（諸元表）に渡す。コンポーネントは `view` の配列を map して描画する。**静的・構造的なスタイルは Tailwind ユーティリティクラス（`className`）で書く**。モデルが**実行時にデータから算出する動的スタイル**（ノード座標、目盛り位置、grid の px 列幅、セルごとの最大/最小ハイライト）だけが `style={css(...)}` によるインラインとして残る。

- **`src/lib/css.ts`** — `css()` ヘルパは、モデルが持つインライン CSS _文字列_ を React の `CSSProperties` オブジェクトへ変換する（プロパティを camelCase 化し、`--custom-props` はそのまま保持）。`lineageModel` が**実行時計算のジオメトリ／色**を文字列で持つ（Tailwind ではビルド時クラス化できない値）ために引き続き必要。使うのはこの動的部分だけで、静的な装飾には使わない。

- **`src/styles/tokens.css`** — **Tailwind のエントリ**（`@import "tailwindcss"`）であり、デザイントークンの単一の正。トークンは `@theme static` ブロックに定義する: トヨタレッド `--color-toyota-red: #eb0a1e`、グレースケール `--color-grey-*`、セマンティック別名（`--color-fg` / `--color-fg-muted` / `--color-fg-subtle` / `--color-surface` / `--color-line` など）、角丸、シャドウ、イージング、フォント。このブロックがコンポーネントで使うユーティリティ（`bg-toyota-red`、`text-fg-muted`、`rounded-lg` …）を生成する。`static` を付けているのは、`lineageModel` の実行時インライン文字列が `var()` で参照する `--radius-pill` / `--ease-standard` / `--duration-base` を確実に `:root` へ出力させるため（Tailwind の未使用トークン刈り込みはこの参照を検知できない）。base 要素スタイル（`body`, `a`）は `@layer base` に置き、ユーティリティで上書き可能にしている。**同じ色が `lineageModel.ts` 冒頭に生の16進定数（`RED`, `GREY9` …）としても重複定義されている — 色を変える場合は両方を更新すること。**

- **Tailwind v4（PostCSS 経由）** — `postcss.config.js` が `@tailwindcss/postcss` を接続する。公式の `@tailwindcss/vite` プラグインはあえて使わない: vite-plus は `vite` を自社フォーク（`@voidzero-dev/vite-plus-core`）にエイリアスしているため、ツールチェーン非依存な PostCSS 経路の方が確実だから。`tailwind.config.js` は無し（v4 はソースを自動検出する）。

したがって典型的な変更フローは、**データ**は `data/*.json` を編集（系譜・現行車種は手書き、諸元は `/rebuild-specs` で再生成）、**ジオメトリ／動的スタイル**は `lineageModel.ts`（とそのテスト）、**静的**なレイアウトや見た目はコンポーネントの Tailwind クラス、**共有トークン**は `tokens.css`（`@theme`）で編集する（色は `lineageModel.ts` の16進定数との二重管理に注意）、というもの。

## デプロイ

`.github/workflows/deploy.yml` により `main` から GitHub Pages へ自動デプロイ（品質ゲート → ビルド → デプロイ）。`main` へのプッシュはそのまま本番公開になる。`vite.config.ts` は Pages のプロジェクトパス用に `base: "/toyota-history/"` をハードコードしているため、リポジトリ名を変えたら合わせて更新すること。`ci.yml` は `main` 以外のブランチ／PR で同じゲートを実行する。
