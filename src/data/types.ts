// data/ 配下の JSON（データ層）の型定義。
// buildLineageView() はこれらを入力に受け取り、描画用の LineageView を組み立てる。
// レイヤは3つ: 系譜（手書き）/ 現行車種マニフェスト＋列定義（手書き）/ 諸元（機械生成）。

// ---- 系譜レイヤ（手書き: data/genealogy.json） ----

export type NameplateStatus = "active" | "discontinued";

export interface Nameplate {
  /** ネームプレート名。識別子も兼ね、派生の derivativeOf 参照に使う */
  label: string;
  /** 補足ラベル（例: "1966–現行" / "派生 / カローラ"） */
  sub: string;
  status: NameplateStatus;
  /** 現行世代の年（status=active のとき）。現行ノードの強調に使う */
  currentYear?: number;
  /** 派生元ネームプレートの label（派生系統のとき） */
  derivativeOf?: string;
  /** 派生が親から枝分かれした年（derivativeOf とセット） */
  branchYear?: number;
  /** 世代の年リスト（左→右に並ぶノード） */
  generations: number[];
}

export interface Genealogy {
  /** 縦の並び順（配列順＝上→下）。派生は親の直上に置く慣習 */
  nameplates: Nameplate[];
}

// ---- 諸元の列定義＋現行車種マニフェスト（手書き: data/lineup.json） ----

export type SpecKind = "text" | "number" | "range";

export interface SpecColumn {
  /** specs 値のキー（VehicleSpecs のキーと一致） */
  key: string;
  /** 表示ラベル */
  label: string;
  kind: SpecKind;
  /** 単位（number/range のとき、表示時に付与） */
  unit?: string;
  /** 列内で最大/最小をハイライトするか（number のみ有効） */
  compare?: boolean;
  /** 表示上まとめる列グループ名（例: 全長/全幅/全高 → "寸法"） */
  group?: string;
}

export interface LineupVehicle {
  /** 車種名（specs のキーと一致させる） */
  name: string;
  /** 行の補足ラベル（ボディタイプの短縮など） */
  type: string;
  /** 取得元 Wikipedia 記事タイトル（パイプラインが取得に使う） */
  wikipediaTitle: string;
  /** 抽出対象の世代。記事内で対象世代を特定し、表示にも使う（例: "2022年 / 16代目"） */
  targetGen: string;
}

export interface Lineup {
  /** 諸元表の列定義（順序＝表示順） */
  columns: SpecColumn[];
  /** 比較表に載せる現行車種（系譜とは独立にキュレーション） */
  vehicles: LineupVehicle[];
}

// ---- 諸元（機械生成: data/specs.json） ----

export interface PriceRange {
  min: number;
  max: number;
}

/**
 * 1車種の諸元。キーは Lineup.columns の key に対応。
 * 値の型は列の kind に従う: text=string / number=number / range=PriceRange。
 * 単位はセルに持たず列定義（SpecColumn.unit）側に一元化する。
 * 発売年・世代は諸元に含めない（LineupVehicle.targetGen から引く）。
 */
export type VehicleSpecs = Record<string, string | number | PriceRange>;

/** 車種名（LineupVehicle.name）→ 諸元 */
export type Specs = Record<string, VehicleSpecs>;
