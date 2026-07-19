---
name: rebuild-specs
description: data/lineup.json の各現行車種について Wikipedia 記事を取得し直し、targetGen 世代の諸元を抽出して data/specs.json を再生成する。実データ（水準 B）で諸元表を更新したいときに使う。
---

# rebuild-specs — 諸元データの再生成

`data/specs.json`（諸元表の実データ）を、日本語版 Wikipedia を一旦信頼ソースとして再生成するスキル。
方針の全体像は `real-data-plan.md`（水準 B = リアルなデモ）を参照。

**抽出はこのスキルを起動した Claude Code 自身が行う。** Anthropic API を呼ぶスクリプト・SDK・API キーは使わない。
「取得」（Wikipedia → `data/raw/`）だけがスクリプト、「抽出」（`data/raw/` → `specs.json`）は Claude Code の読解で行う、という分離を守ること。

## 前提

- 全編集・全出力・コメントは日本語（リポジトリの CLAUDE.md 準拠）。
- `git commit` はしない。ファイルの生成・更新までが担当。

## 手順

### 1. マニフェストを読む

- `data/lineup.json` を読み、`columns`（諸元の列定義）と `vehicles`（対象の現行車種）を把握する。
- `src/data/types.ts` の型（`SpecColumn` / `LineupVehicle` / `VehicleSpecs` / `PriceRange` / `Specs`）を読み、出力スキーマを確認する。
- 各 `vehicles[]` の `name` / `wikipediaTitle` / `targetGen` を控える。`targetGen`（例: `"2022年 / 16代目"`）が**抽出対象の世代**。

### 2. Wikipedia 記事を取得（data/raw/ を更新）

```
npm run build:data:fetch
```

- `scripts/fetch-wikipedia.mjs` が `data/lineup.json` の全 `wikipediaTitle` を取得し `data/raw/<title>.txt` に保存する（依存ゼロ・決定的）。
- 1車種だけ試したいときは `node scripts/fetch-wikipedia.mjs <名前 or 記事タイトル>`。
- 失敗（記事なし・空本文など）が出たら、その車種は該当箇所を見直す。全滅でなければ取得できたものだけで続行してよい。

### 3. 各記事から targetGen 世代の諸元を抽出

各 `vehicles[]` について、対応する `data/raw/<wikipediaTitle>.txt` を Read し、`targetGen` が指す世代の諸元を読み取る。
記事には複数世代が並ぶので、**`targetGen` の世代（年・◯代目/系）に一致する節・諸元表を特定してから**値を拾うこと。世代を取り違えない。

`data/lineup.json` の `columns` に対応する各キーを、次のルールで埋める:

- **数値ネイティブ**: `number` / `range` 列の値は数値。文字列にしない。
- **単位はセルに持たない**: `columns[].unit`（mm / kg / PS / km/L / 万円 …）は列定義側に一元化済み。セルには純粋な数値だけを入れる（`"4930mm"` ではなく `4930`）。
- **寸法は3分割**: 全長×全幅×全高は `length` / `width` / `height` の3つの number に分ける。
- **価格は {min, max}**: `price` は `{ "min": number, "max": number }`（万円）。グレード幅の下限・上限。単一価格なら min=max。
- **発売年は入れない**: 発売年・世代は諸元に含めない（`targetGen` から引く）。`year` 等のキーを作らない。
- **カテゴリ項目は文字列**: `bodyType` / `engine` / `drivetrain` などの `text` 列は文字列のまま。
- グレード違いで幅がある数値（重量・燃費・出力など）は、代表的な1グレード（できれば HEV / 上位など `targetGen` を代表する構成）を選ぶか、記事が明示する主要値を採る。判断が割れる場合は主力グレードを優先。

出力キーは `columns[].key` に厳密に一致させる（`length` / `width` / `height` / `wheelbase` / `weight` / `power` / `seats` / `fuelEconomy` は number、`price` は range、それ以外の text はキー通り）。

### 4. data/specs.json を上書き

- `data/specs.json` を、`Specs` 型（`車種名(LineupVehicle.name) → VehicleSpecs`）に従って**丸ごと上書き**する。
- キー順は `lineup.json` の `vehicles` 並び、各諸元は `columns` 並びにすると差分が読みやすい。
- 既存ファイルはシード（ダミー）。実データで置き換える。

> 注意: 今この整備タスクでは **specs.json をまだ生成しない**（既存はシード扱いで温存）。上記は実際に `/rebuild-specs` を起動したときの手順。

### 5. 検証

```
npm test
```

- 通ればデータ整合（lineup ↔ specs 対応、数値の有限性、必須フィールド等）が取れている。
- 落ちたら該当車種・該当キーを 3〜4 の手順に戻って修正し、再度 `npm test`。
- 仕上げに `npm run check`（fmt + lint + 型）を通してから完了報告する。

## 完了時の報告

- 更新した車種数、`data/raw/` の取得件数、`npm test` の結果を報告する。
- 抽出時に判断が割れた点（グレード選択・世代特定で迷った箇所）があれば明示する。
