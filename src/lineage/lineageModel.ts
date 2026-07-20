// 「系譜ビューア.dc.html」(Claude Design) の renderVals() を TypeScript へ移植したもの。
// データはベタ書きせず data/*.json（Genealogy / Lineup / Specs）を引数に受け取り、
// レイアウト計算（タイムライン座標・SVG コネクタ・grid 列幅・諸元の最大/最小ハイライト）
// と完成済みインライン CSS 文字列の生成だけを担う純粋・決定的な関数。
// スタイル文字列はデザインモックのものをそのまま再現している。
//
// 樹形図はカテゴリ別の「自己完結サブトラック」に分割される（categories.ts の順）。
// 各グループは自前の SVG・自前の高さ・グループローカル y 座標を持ち、
// x 軸（xFor / ticks / trackW）だけを全グループで共有して年代を縦に揃える。
// これにより折りたたみ（コンポーネント側の UI 関心）でグループをまたぐ座標再計算が
// 不要になり、buildLineageView は折りたたみ状態から独立した純粋関数のまま保てる。

import { CATEGORIES, type CategoryId } from "../data/categories";
import type { Genealogy, Lineup, Nameplate, PriceRange, SpecColumn, Specs } from "../data/types";

export interface LabelItem {
  name: string;
  sub: string;
  color: string;
  subStyle: string;
  style: string;
}

export interface Tick {
  label: string;
  lineStyle: string;
  labelStyle: string;
}

export interface TreeNode {
  /** ネームプレート名（例: "カローラ"）。詳細パネルの識別・見出しに使う */
  label: string;
  /** この世代の年。label と組で1ノードを一意に識別する */
  year: number;
  genLabel: string;
  isCurrent: boolean;
  /** 世代ごとの解説文（genealogy.json の overviews 由来。無い場合あり） */
  overview?: string;
  silColor: string;
  thumbStyle: string;
  genStyle: string;
  style: string;
}

export type Connector =
  | {
      kind: "line";
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      stroke: string;
      strokeWidth: number;
      strokeLinecap: string;
    }
  | { kind: "path"; d: string; stroke: string; strokeWidth: number; strokeDasharray: string }
  | { kind: "circle"; cx: number; cy: number; r: number; fill: string };

/** カテゴリ1つ分の自己完結サブトラック（縦積みされる単位＝折りたたみの単位） */
export interface LineageGroup {
  id: CategoryId;
  title: string;
  /** このグループに属するネームプレート数（見出しに表示） */
  count: number;
  labelColStyle: string;
  labels: LabelItem[];
  ticks: Tick[];
  nodes: TreeNode[];
  connectors: Connector[];
  /** 全グループ共有の幅（年代を縦に揃えるため） */
  trackW: number;
  /** このグループ固有の高さ */
  trackH: number;
  trackStyle: string;
}

export interface SpecCol {
  label: string;
  num?: boolean;
  headStyle: string;
}

export interface Cell {
  text: string;
  tag: string;
  tagStyle: string;
  textStyle: string;
  style: string;
}

export interface VehicleRow {
  name: string;
  type: string;
  silColor: string;
  cells: Cell[];
  rowStyle: string;
  vehStyle: string;
  thumbStyle: string;
}

export interface LineageView {
  /** 全グループ共有の時間軸メタ（テスト・デバッグ用） */
  axis: { Y0: number; Y1: number; trackW: number };
  /** カテゴリ別サブトラック（CATEGORIES 順、空カテゴリは含まない） */
  groups: LineageGroup[];
  specCols: SpecCol[];
  vehicleRows: VehicleRow[];
  compareHeadStyle: string;
  headVehStyle: string;
}

// tokens.css の @theme と同じ色。色を変える場合は両方を更新すること。
const RED = "#EB0A1E",
  GREY9 = "#1A1B1C",
  GREY6 = "#58595B",
  GREY4 = "#9A9C9F",
  GREY3 = "#BDBEC0",
  GREY2 = "#D9DADC",
  GREY1 = "#ECECED",
  GREY05 = "#F5F5F6";

// ---- レイアウト定数（グループ幾何で共有） ----
const NODE_H = 60,
  CEN = 30, // ノード上端からの中心オフセット
  START = 46, // グループ内 先頭ノードの top
  TIGHT = 72, // 派生とその親の縦間隔（詰め）
  LOOSE = 96; // 系統グループ間の縦間隔（余白）
const AXIS = 34, // 年目盛り帯の高さ
  NODE_W = 58; // ノード幅（旧66から微縮小。世代間隔が短い際の水平衝突を緩和）

// 数値の表示整形（桁区切り。小数は保持）。例: 2850 → "2,850" / 22.4 → "22.4"
const fmtNum = (n: number) => n.toLocaleString("ja-JP");

/**
 * カテゴリ1つ分のサブトラックを組む。縦位置・ラベル・ノード・コネクタ・目盛りを
 * グループローカル座標で算出する。x 軸（xFor / Y0 / Y1 / trackW）は呼び出し側から
 * 共有で受け取り、全グループで年代を縦に揃える。
 */
function buildGroupTrack(
  id: CategoryId,
  title: string,
  members: Nameplate[],
  xFor: (y: number) => number,
  Y0: number,
  Y1: number,
  trackW: number,
): LineageGroup {
  // ---- 縦位置レイアウト（グループ内ローカル） ----
  // 派生（derivativeOf）は配列上で親の直上に置く慣習。
  // 「派生→その親」の間は詰め、系統グループの境界には余白を入れる。
  const ys: number[] = [];
  members.forEach((np, i) => {
    if (i === 0) {
      ys.push(START);
      return;
    }
    const prev = members[i - 1];
    // 直前が派生で、その親が今の行なら詰める（派生は親の直上・同一カテゴリ内）
    const isParentOfPrev = prev.derivativeOf != null && prev.derivativeOf === np.label;
    ys.push(ys[i - 1] + (isParentOfPrev ? TIGHT : LOOSE));
  });
  const yByLabel = new Map(members.map((np, i) => [np.label, ys[i]]));
  const trackH = ys[ys.length - 1] + NODE_H + 34;

  // ---- 目盛り（1年ごと・グループ高さに合わせる） ----
  const ticks: Tick[] = [];
  for (let y = Y0; y <= Y1; y++) {
    const x = xFor(y);
    const isNow = y === Y1;
    const decade = y % 10 === 0;
    ticks.push({
      label: isNow ? "現在" : String(y),
      lineStyle: `position:absolute;top:${AXIS}px;left:${x}px;width:1px;height:${trackH - AXIS}px;background:${isNow ? "rgba(235,10,30,0.18)" : decade ? GREY1 : GREY05};z-index:0`,
      labelStyle: `position:absolute;top:13px;left:${x}px;transform:translateX(-50%);font-size:9px;font-weight:${isNow || decade ? 700 : 500};color:${isNow ? RED : decade ? GREY6 : GREY3};letter-spacing:0;white-space:nowrap`,
    });
  }

  // ---- ネームプレート列（固定） ----
  const labelColStyle = `position:relative;width:132px;flex:none;background:${GREY05};border-right:1px solid ${GREY2};height:${trackH}px`;
  const labels: LabelItem[] = members.map((np, i) => ({
    name: np.label,
    sub: np.sub,
    color: np.status === "discontinued" ? GREY4 : GREY9,
    subStyle: `display:block;margin-top:3px;font-size:10px;font-weight:500;color:${GREY4}`,
    style: `position:absolute;top:${ys[i] + 6}px;left:0;width:132px;padding:0 14px;height:${NODE_H}px;display:flex;flex-direction:column;justify-content:center`,
  }));

  // ---- ノード ----
  const nodes: TreeNode[] = [];
  members.forEach((np, i) => {
    const top = ys[i];
    np.generations.forEach((year, gi) => {
      const x = xFor(year);
      const isCurrent = np.status === "active" && np.currentYear === year;
      let border: string, gc: string, sil: string, thumbBg: string, shadow: string;
      if (np.status === "discontinued") {
        border = `1.5px solid ${GREY2}`;
        gc = GREY4;
        sil = GREY3;
        thumbBg = GREY05;
        shadow = "0 1px 2px rgba(0,0,0,0.05)";
      } else if (isCurrent) {
        border = `1.5px solid ${RED}`;
        gc = RED;
        sil = RED;
        thumbBg = "#fdeef0";
        shadow = "0 4px 14px rgba(235,10,30,0.22)";
      } else {
        border = `1.5px solid ${GREY3}`;
        gc = GREY9;
        sil = GREY6;
        thumbBg = GREY1;
        shadow = "0 1px 3px rgba(0,0,0,0.07)";
      }
      nodes.push({
        label: np.label,
        year,
        genLabel: gi + 1 + "代目",
        isCurrent,
        overview: np.overviews?.[String(year)],
        silColor: sil,
        thumbStyle: `width:100%;height:26px;background:${thumbBg};border-radius:5px;display:flex;align-items:center;justify-content:center;margin-bottom:5px`,
        genStyle: `font-size:10px;font-weight:700;color:${gc};letter-spacing:0.01em;line-height:1`,
        style:
          `position:absolute;top:${top}px;left:${x - NODE_W / 2}px;width:${NODE_W}px;height:${NODE_H}px;box-sizing:border-box;padding:6px 6px 7px;` +
          `display:flex;flex-direction:column;align-items:center;justify-content:center;` +
          `background:#fff;border:${border};border-radius:11px;z-index:2;box-shadow:${shadow};` +
          `transition:transform var(--duration-base) var(--ease-standard),box-shadow var(--duration-base) var(--ease-standard);cursor:pointer`,
      });
    });
  });

  // ---- コネクタ ----
  const connectors: Connector[] = [];
  members.forEach((np, i) => {
    const xs = np.generations.map(xFor);
    const y = ys[i] + CEN;
    const laneCol = np.status === "discontinued" ? GREY2 : GREY4;
    connectors.push({
      kind: "line",
      x1: xs[0],
      y1: y,
      x2: xs[xs.length - 1],
      y2: y,
      stroke: laneCol,
      strokeWidth: 3,
      strokeLinecap: "round",
    });
    // 派生系統: 親レーンから枝分かれ年で分岐する破線＋分岐点。
    // 親が同一グループ内にいる場合のみ描く（別カテゴリの派生は独立レーンへ縮退）。
    const parentY = np.derivativeOf != null ? yByLabel.get(np.derivativeOf) : undefined;
    if (np.branchYear != null && parentY != null) {
      const bx = xFor(np.branchYear);
      const py = parentY + CEN;
      connectors.push({
        kind: "path",
        d: `M ${bx} ${py} L ${bx} ${y}`,
        stroke: GREY4,
        strokeWidth: 2,
        strokeDasharray: "4 4",
      });
      connectors.push({ kind: "circle", cx: bx, cy: py, r: 3, fill: GREY4 });
    }
  });

  const trackStyle = `position:relative;width:${trackW}px;height:${trackH}px;background:#fff`;

  return {
    id,
    title,
    count: members.length,
    labelColStyle,
    labels,
    ticks,
    nodes,
    connectors,
    trackW,
    trackH,
    trackStyle,
  };
}

export function buildLineageView(
  genealogy: Genealogy,
  lineup: Lineup,
  specs: Specs,
  nowYear = 2026,
): LineageView {
  const nameplates = genealogy.nameplates;

  // ---- 共有タイムライン幾何 ----
  const allYears = nameplates.flatMap((np) => np.generations);
  const Y0 = Math.min(...allYears),
    Y1 = Math.max(nowYear, ...allYears), // 右端＝「現在」（データが未来年を含んでも安全側）
    PAD = 60,
    PX = 30;
  const xFor = (y: number) => PAD + (y - Y0) * PX;
  const trackW = xFor(Y1) + 70;

  // ---- カテゴリ別グループ化（CATEGORIES 順・配列内順序は保持） ----
  const groups: LineageGroup[] = [];
  for (const cat of CATEGORIES) {
    const members = nameplates.filter((np) => np.category === cat.id);
    if (members.length === 0) continue;
    groups.push(buildGroupTrack(cat.id, cat.title, members, xFor, Y0, Y1, trackW));
  }

  // ---- 諸元比較表（車種=行 / 諸元=列） ----
  // 表示列 = lineup.columns（ボディタイプ→寸法3列→…→価格）に、
  // ボディタイプ直後へ「発売年・世代」（targetGen 由来の合成列）を差し込む。
  interface DispCol {
    key: string; // specs のキー。合成列は "__gen"
    label: string; // 単位付きの表示ラベル
    kind: SpecColumn["kind"];
    compare: boolean; // 数値の最大/最小ハイライト対象か
    width: number; // grid 列幅(px)
  }
  const GEN_KEY = "__gen";
  const withUnit = (c: SpecColumn) =>
    (c.kind === "number" || c.kind === "range") && c.unit ? `${c.label} (${c.unit})` : c.label;
  const widthFor = (kind: SpecColumn["kind"]) =>
    kind === "range" ? 150 : kind === "number" ? 100 : 140;

  const dispCols: DispCol[] = [];
  lineup.columns.forEach((c, ci) => {
    dispCols.push({
      key: c.key,
      label: withUnit(c),
      kind: c.kind,
      compare: c.kind === "number" && c.compare === true,
      width: widthFor(c.kind),
    });
    // 先頭（ボディタイプ）の直後に発売年・世代を挿入
    if (ci === 0) {
      dispCols.push({
        key: GEN_KEY,
        label: "発売年・世代",
        kind: "text",
        compare: false,
        width: 128,
      });
    }
  });

  const specCols: SpecCol[] = dispCols.map((c) => ({
    label: c.label,
    num: c.kind === "number",
    headStyle: `padding:16px 14px;border-left:1px solid ${GREY2};font-size:11.5px;font-weight:700;color:${GREY6};display:flex;align-items:flex-end;line-height:1.35`,
  }));

  // 各セルの表示文字列を算出（発売年・世代は lineup、諸元は specs から）
  const cellText = (c: DispCol, vehName: string, targetGen: string): string => {
    if (c.key === GEN_KEY) return targetGen;
    const raw = specs[vehName]?.[c.key];
    if (raw == null) return "";
    if (c.kind === "range") {
      const p = raw as PriceRange;
      return `${fmtNum(p.min)}〜${fmtNum(p.max)}`;
    }
    if (c.kind === "number") return fmtNum(raw as number);
    return String(raw);
  };

  // 列ごとの最大/最小インデックス（compare 対象の数値列のみ）
  const colStats = dispCols.map((c) => {
    if (!c.compare) return null;
    let mx = -Infinity,
      mn = Infinity,
      maxI = -1,
      minI = -1;
    lineup.vehicles.forEach((v, i) => {
      const raw = specs[v.name]?.[c.key];
      if (typeof raw !== "number") return;
      if (raw > mx) {
        mx = raw;
        maxI = i;
      }
      if (raw < mn) {
        mn = raw;
        minI = i;
      }
    });
    if (mx === mn) return null;
    return { maxI, minI };
  });

  const GRID = `display:grid;grid-template-columns:200px ${dispCols.map((c) => c.width + "px").join(" ")}`;
  const compareHeadStyle = `${GRID};background:${GREY05};border-bottom:1px solid ${GREY2}`;
  const headVehStyle = `position:sticky;left:0;z-index:3;background:${GREY05};padding:16px 18px;font-size:12px;font-weight:700;letter-spacing:0.06em;color:${GREY4};display:flex;align-items:flex-end;border-right:1px solid ${GREY2}`;

  const vehicleRows: VehicleRow[] = lineup.vehicles.map((v, vi) => {
    const cells: Cell[] = dispCols.map((c, ci) => {
      const text = cellText(c, v.name, v.targetGen);
      const st = colStats[ci];
      const isMax = !!st && st.maxI === vi;
      const isMin = !!st && st.minI === vi;
      let bg = "transparent",
        tc = GREY9,
        tag = "",
        tagStyle = "";
      if (isMax) {
        bg = "#fdeef0";
        tc = RED;
        tag = "最大";
        tagStyle = `font-size:8.5px;font-weight:800;letter-spacing:0.04em;color:#fff;background:${RED};padding:1px 6px;border-radius:var(--radius-pill)`;
      } else if (isMin) {
        bg = GREY05;
        tc = GREY4;
        tag = "最小";
        tagStyle = `font-size:8.5px;font-weight:800;letter-spacing:0.04em;color:${GREY6};background:${GREY2};padding:1px 6px;border-radius:var(--radius-pill)`;
      }
      return {
        text,
        tag,
        tagStyle,
        textStyle: `font-size:13.5px;font-weight:${isMax ? 700 : 500};color:${tc};letter-spacing:-0.01em`,
        style: `padding:14px 14px;border-left:1px solid ${GREY1};display:flex;align-items:center;flex-wrap:wrap;gap:7px;background:${bg}`,
      };
    });
    return {
      name: v.name,
      type: v.type,
      silColor: GREY6,
      cells,
      rowStyle: `${GRID};border-bottom:1px solid ${GREY1};background:#fff`,
      vehStyle: `position:sticky;left:0;z-index:2;background:#fff;padding:14px 18px;display:flex;align-items:center;gap:12px;border-right:1px solid ${GREY1}`,
      thumbStyle: `width:64px;height:40px;flex:none;background:${GREY1};border-radius:6px;display:flex;align-items:center;justify-content:center`,
    };
  });

  return {
    axis: { Y0, Y1, trackW },
    groups,
    specCols,
    vehicleRows,
    compareHeadStyle,
    headVehStyle,
  };
}
