# トヨタ車 系譜ビューア

> トヨタ車のネームプレートを、世代・派生の樹形図で振り返る単一ページの静的サイト。

[![Deploy to GitHub Pages](https://github.com/tanny-pm/toyota-history/actions/workflows/deploy.yml/badge.svg)](https://github.com/tanny-pm/toyota-history/actions/workflows/deploy.yml)
![React](https://img.shields.io/badge/React-19-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)
![License](https://img.shields.io/badge/License-MIT-green)

**▶ ライブデモ: https://tanny-pm.github.io/toyota-history/**

---

## これは何？

トヨタが送り出してきた車種を「系譜（世代・派生）」の樹形図でたどり、あわせて車種ごとのスペック（諸元）差を並べて比較できる Web ビューアです。横軸のタイムライン上に各ネームプレートの世代が並び、現行モデルは強調、生産終了モデルはグレーアウトで表示されるので、「どの車種が今も続いていて、どこで枝分かれしたのか」が一目でわかります。

> [!NOTE]
> **掲載データはすべてダミーです。** 見た目・レイアウト・情報構造の検証を目的としたモックであり、実在車種の正確な諸元・発売年の考証は行っていません。数値は「もっともらしい桁・単位」に揃えたサンプルです。

## 主な機能

- **系譜の樹形図** — 時間を左→右に流す横軸タイムライン。行＝ネームプレート、ノード＝世代。世代は横線でつながり、派生系統（例: カローラ → レビン）は上下に枝分かれして表示されます。
- **現行 / 廃番の視覚化** — 右端（現在）に残る現行世代はアクセント色＋「現行」バッジで強調。生産終了したノードはグレーアウト。
- **諸元比較表** — 車種を横並びにしてスペックを比較。全長・ホイールベース・車両重量・出力・燃費・価格帯などを行ごとに並べ、各項目の最大 / 最小セルを軽くハイライトします。プルダウンで比較対象を差し替える体裁を用意しています。
- **レスポンシブ** — タイムラインが画面幅を超える場合も、横スクロールはその領域内に閉じ込め、ページ本体は横スクロールしません。

## 使い方

インストール不要です。ブラウザで [ライブデモ](https://tanny-pm.github.io/toyota-history/) を開くだけで、系譜樹形図と諸元比較表が縦に並んで表示されます。

- タイムラインを左右にスクロールして、各ネームプレートの世代の移り変わりを追えます。
- 「現行」バッジのついたノードが、いま売られているモデルです。グレーのノードは生産終了を表します。
- 下部の諸元比較表で、複数車種のスペック差を横並びで確認できます。

## ローカルで動かす

自分の環境で動かしたり、手を加えたりしたい場合の手順です。

### 必要なもの

- Node.js 20 以上
- npm

### セットアップ

```bash
git clone https://github.com/tanny-pm/toyota-history.git
cd toyota-history
npm install
npm run dev
```

開発サーバが起動したら、表示された URL（既定では http://localhost:5173/toyota-history/）をブラウザで開いてください。

### 本番ビルド

```bash
npm run build      # dist/ へ出力
npm run preview    # ビルド結果をローカルで確認
```

## 技術スタック

| 領域                    | 採用技術                                                     |
| ----------------------- | ------------------------------------------------------------ |
| UI                      | React 19 + TypeScript                                        |
| ビルド / ツールチェーン | [vite-plus](https://www.npmjs.com/package/vite-plus)（`vp`） |
| スタイル                | Tailwind CSS v4（PostCSS 経由）＋ デザイントークン           |
| テスト                  | Vitest                                                       |
| ホスティング            | GitHub Pages（`main` への push で自動デプロイ）              |

設計は「1つの純粋関数がレイアウト・ジオメトリ・ダミーデータを計算し、コンポーネントは描画するだけ」という方針です。詳細な開発ガイドは [`CLAUDE.md`](./CLAUDE.md) を参照してください。

## ライセンス

MIT License
