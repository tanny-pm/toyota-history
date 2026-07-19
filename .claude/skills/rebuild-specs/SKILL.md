---
name: rebuild-specs
description: data/lineup.json の各現行車種についてトヨタ公式サイト(toyota.jp)の主要諸元 PDF を取得し直し、targetGen 相当の現行グレードの諸元を抽出して data/specs.json を再生成する。実データ（水準 B）で諸元表を更新したいときに使う。
---

# rebuild-specs — 諸元データの再生成

`data/specs.json`（諸元表の実データ）を、**トヨタ公式サイト（toyota.jp）の主要諸元 PDF** を信頼ソースとして再生成するスキル。
方針の全体像は `real-data-plan.md`（水準 B = リアルなデモ）を参照。

**抽出はこのスキルを起動した Claude Code 自身が行う。** Anthropic API を呼ぶスクリプト・SDK・API キーは使わない。
「取得」（toyota.jp → `data/raw/*.pdf`）だけが依存ゼロのスクリプト、「抽出」（`data/raw/*.pdf` → `specs.json`）は
Claude Code が **PDF を Read** して行う、という分離を守ること。

## 前提

- 全編集・全出力・コメントは日本語（リポジトリの CLAUDE.md 準拠）。
- `git commit` はしない。ファイルの生成・更新までが担当。

## 手順

### 1. マニフェストを読む

- `data/lineup.json` を読み、`columns`（諸元の列定義）と `vehicles`（対象の現行車種）を把握する。
- `src/data/types.ts` の型（`SpecColumn` / `LineupVehicle` / `VehicleSpecs` / `PriceRange` / `Specs`）を読み、出力スキーマを確認する。
- 各 `vehicles[]` の `name` / `modelSlug` / `targetGen` を控える。`targetGen`（例: `"2022年 / 16代目"`）が**抽出対象の世代**。

### 2. 公式諸元 PDF を取得（data/raw/ を更新）

```
npm run build:data:fetch
```

- `scripts/fetch-toyota.mjs` が各 `modelSlug` について諸元ページ `https://toyota.jp/<modelSlug>/specification/`
  （見つからなければトップ `/<modelSlug>/` にフォールバック）を取得し、
  本文から `/pages/contents/<modelSlug>/..._spec_<YYYYMM>.pdf`（日付は動的抽出・最新月を採用）を見つけて
  `https://toyota.jp` + そのパスの PDF を `data/raw/<車名>_spec.pdf` に保存する（依存ゼロ・決定的・node:https のみ）。
- 1車種だけ試したいときは `node scripts/fetch-toyota.mjs <車名>`（例: `node scripts/fetch-toyota.mjs クラウン`）。
- 失敗（PDF パスが見つからない・PDF でない応答など）が出たら、公式サイトの構成変更を疑い該当 slug を見直す。
  全滅でなければ取得できたものだけで続行してよい。

### 3. 各 PDF から targetGen 相当・現行グレードの諸元を抽出

各 `vehicles[]` について、対応する `data/raw/<車名>_spec.pdf` を **Read**（PDF 読み取り）し、諸元を読み取る。
主要諸元 PDF は現行モデルのグレード別に諸元が並ぶので、`targetGen` が指す現行世代の**代表グレードの列**を特定してから値を拾う。

`data/lineup.json` の `columns` に対応する各キーを、次のルールで埋める:

- **数値ネイティブ**: `number` / `range` 列の値は数値。文字列にしない。
- **単位はセルに持たない**: `columns[].unit`（mm / kg / PS / km/L / 万円 …）は列定義側に一元化済み。セルには純粋な数値だけを入れる（`"4930mm"` ではなく `4930`）。
- **代表グレードを選ぶ**: グレード別に幅がある数値（重量・燃費・出力・寸法差など）は、その車種の**主力グレード**（多くは主力 HEV／量販グレード）を1つ選び、その列の値で統一する。世代・シリーズ代表になる構成を優先。
- **最高出力はエンジン単体のネット PS**: モーター込みのシステム最高出力ではなく、**エンジン単体の最高出力（ネット, PS）**を採る。
- **寸法は3分割**: 全長×全幅×全高は `length` / `width` / `height` の3つの number に分ける。
- **価格は概算（参考値）**: 公式主要諸元 PDF には価格が載らないため、`price` は `{ min, max }`（万円）を**概算の参考値**として入れる（グレード帯のおおよその下限・上限）。厳密な考証は課さない（水準 B）。
- **発売年は入れない**: 発売年・世代は諸元に含めない（`targetGen` から引く）。`year` 等のキーを作らない。
- **カテゴリ項目は文字列**: `bodyType` / `engine` / `drivetrain` などの `text` 列は文字列のまま。

出力キーは `columns[].key` に厳密に一致させる（`length` / `width` / `height` / `wheelbase` / `weight` / `power` / `seats` / `fuelEconomy` は number、`price` は range、それ以外の text はキー通り）。

### 4. data/specs.json を上書き

- `data/specs.json` を、`Specs` 型（`車種名(LineupVehicle.name) → VehicleSpecs`）に従って**丸ごと上書き**する。
- キー順は `lineup.json` の `vehicles` 並び、各諸元は `columns` 並びにすると差分が読みやすい。

> 注意: 現状の `data/specs.json` は既に公式 PDF ベースで実データ化済み。**むやみに上書きしない**。
> 上記は実際に諸元を作り直す（車種追加・世代更新など）目的で `/rebuild-specs` を起動したときの手順。

### 5. 検証

```
npm test
```

- 通ればデータ整合（lineup ↔ specs 対応、数値の有限性、必須フィールド等）が取れている。
- 落ちたら該当車種・該当キーを 3〜4 の手順に戻って修正し、再度 `npm test`。
- 仕上げに `npm run check`（fmt + lint + 型）を通してから完了報告する。

## 完了時の報告

- 更新した車種数、`data/raw/` の取得件数、`npm test` の結果を報告する。
- 抽出時に判断が割れた点（代表グレードの選択・価格の概算根拠など）があれば明示する。
