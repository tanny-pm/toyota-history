// 「系譜ビューア.dc.html」(Claude Design) の renderVals() を TypeScript へ忠実移植。
// レイアウト計算・ダミーデータ・スタイル文字列はデザインモックのものをそのまま再現している。

export interface LabelItem {
  name: string
  sub: string
  color: string
  subStyle: string
  style: string
}

export interface Tick {
  label: string
  lineStyle: string
  labelStyle: string
}

export interface TreeNode {
  genLabel: string
  isCurrent: boolean
  silColor: string
  thumbStyle: string
  genStyle: string
  style: string
}

export type Connector =
  | { kind: 'line'; x1: number; y1: number; x2: number; y2: number; stroke: string; strokeWidth: number; strokeLinecap: string }
  | { kind: 'path'; d: string; stroke: string; strokeWidth: number; strokeDasharray: string }
  | { kind: 'circle'; cx: number; cy: number; r: number; fill: string }

export interface SpecCol {
  label: string
  num?: boolean
  headStyle: string
}

export interface Cell {
  text: string
  tag: string
  tagStyle: string
  textStyle: string
  style: string
}

export interface VehicleRow {
  name: string
  type: string
  silColor: string
  cells: Cell[]
  rowStyle: string
  vehStyle: string
  thumbStyle: string
}

export interface LineageView {
  labelColStyle: string
  labels: LabelItem[]
  ticks: Tick[]
  nodes: TreeNode[]
  connectors: Connector[]
  trackW: number
  trackH: number
  trackStyle: string
  specCols: SpecCol[]
  vehicleRows: VehicleRow[]
  compareHeadStyle: string
  headVehStyle: string
}

interface RowRaw {
  label: string
  sub: string
  y: number
  kind: 'active' | 'discontinued'
  current?: number
  branchYear?: number
  parentY?: number
  gens: number[]
}

const RED = '#EB0A1E',
  GREY9 = '#1A1B1C',
  GREY6 = '#58595B',
  GREY4 = '#9A9C9F',
  GREY3 = '#BDBEC0',
  GREY2 = '#D9DADC',
  GREY1 = '#ECECED',
  GREY05 = '#F5F5F6'

export function buildLineageView(): LineageView {
  // ---- timeline geometry ----
  const Y0 = 1966,
    Y1 = 2026,
    PAD = 60,
    PX = 30
  const xFor = (y: number) => PAD + (y - Y0) * PX
  const trackW = xFor(Y1) + 70
  const AXIS = 34,
    NODE_W = 66,
    NODE_H = 60,
    CEN = 30 // node center offset from top

  // rows: derivative rows sit directly above their parent
  const rowsRaw: RowRaw[] = [
    { label: 'レビン', sub: '派生 / カローラ', y: 46, kind: 'discontinued', branchYear: 1972, parentY: 118, gens: [1972, 1983, 1991, 1998] },
    { label: 'カローラ', sub: '1966–現行', y: 118, kind: 'active', current: 2019, gens: [1966, 1972, 1979, 1987, 2000, 2012, 2019] },
    { label: 'クラウン', sub: '1966–現行', y: 214, kind: 'active', current: 2022, gens: [1967, 1974, 1983, 1991, 2003, 2018, 2022] },
    { label: 'プラド', sub: '派生 / ランクル', y: 300, kind: 'active', current: 2020, branchYear: 1990, parentY: 372, gens: [1990, 1996, 2002, 2009, 2020] },
    { label: 'ランドクルーザー', sub: '1966–現行', y: 372, kind: 'active', current: 2021, gens: [1966, 1980, 1990, 1998, 2007, 2021] },
    { label: 'セリカ', sub: '1970–2006 廃番', y: 468, kind: 'discontinued', gens: [1970, 1977, 1985, 1994, 1999, 2006] },
  ]
  const trackH = 468 + NODE_H + 34

  // ticks — one per year
  const ticks: Tick[] = []
  for (let y = Y0; y <= Y1; y++) {
    const x = xFor(y)
    const isNow = y === Y1
    const decade = y % 10 === 0
    ticks.push({
      label: isNow ? '現在' : String(y),
      lineStyle: `position:absolute;top:${AXIS}px;left:${x}px;width:1px;height:${trackH - AXIS}px;background:${isNow ? 'rgba(235,10,30,0.18)' : decade ? GREY1 : GREY05};z-index:0`,
      labelStyle: `position:absolute;top:13px;left:${x}px;transform:translateX(-50%);font-size:9px;font-weight:${isNow || decade ? 700 : 500};color:${isNow ? RED : decade ? GREY6 : GREY3};letter-spacing:0;white-space:nowrap`,
    })
  }

  // labels column
  const labelColStyle = `position:relative;width:132px;flex:none;background:${GREY05};border-right:1px solid ${GREY2};height:${trackH}px`
  const labels: LabelItem[] = rowsRaw.map((r) => ({
    name: r.label,
    sub: r.sub,
    color: r.kind === 'discontinued' ? GREY4 : GREY9,
    subStyle: `display:block;margin-top:3px;font-size:10px;font-weight:500;color:${GREY4}`,
    style: `position:absolute;top:${r.y + 6}px;left:0;width:132px;padding:0 14px;height:${NODE_H}px;display:flex;flex-direction:column;justify-content:center`,
  }))

  // nodes
  const nodes: TreeNode[] = []
  rowsRaw.forEach((r) => {
    r.gens.forEach((year, i) => {
      const x = xFor(year)
      const isCurrent = r.current === year
      let border: string, gc: string, sil: string, thumbBg: string, shadow: string
      if (r.kind === 'discontinued') {
        border = `1.5px solid ${GREY2}`
        gc = GREY4
        sil = GREY3
        thumbBg = GREY05
        shadow = '0 1px 2px rgba(0,0,0,0.05)'
      } else if (isCurrent) {
        border = `1.5px solid ${RED}`
        gc = RED
        sil = RED
        thumbBg = '#fdeef0'
        shadow = '0 4px 14px rgba(235,10,30,0.22)'
      } else {
        border = `1.5px solid ${GREY3}`
        gc = GREY9
        sil = GREY6
        thumbBg = GREY1
        shadow = '0 1px 3px rgba(0,0,0,0.07)'
      }
      nodes.push({
        genLabel: i + 1 + '代目',
        isCurrent,
        silColor: sil,
        thumbStyle: `width:100%;height:26px;background:${thumbBg};border-radius:5px;display:flex;align-items:center;justify-content:center;margin-bottom:5px`,
        genStyle: `font-size:10px;font-weight:700;color:${gc};letter-spacing:0.01em;line-height:1`,
        style:
          `position:absolute;top:${r.y}px;left:${x - NODE_W / 2}px;width:${NODE_W}px;height:${NODE_H}px;box-sizing:border-box;padding:6px 6px 7px;` +
          `display:flex;flex-direction:column;align-items:center;justify-content:center;` +
          `background:#fff;border:${border};border-radius:11px;z-index:2;box-shadow:${shadow};` +
          `transition:transform var(--duration-base) var(--ease-standard),box-shadow var(--duration-base) var(--ease-standard);cursor:default`,
      })
    })
  })

  // connectors
  const connectors: Connector[] = []
  rowsRaw.forEach((r) => {
    const xs = r.gens.map(xFor)
    const y = r.y + CEN
    const laneCol = r.kind === 'discontinued' ? GREY2 : GREY4
    connectors.push({ kind: 'line', x1: xs[0], y1: y, x2: xs[xs.length - 1], y2: y, stroke: laneCol, strokeWidth: 3, strokeLinecap: 'round' })
    if (r.branchYear != null && r.parentY != null) {
      const bx = xFor(r.branchYear)
      const py = r.parentY + CEN
      connectors.push({ kind: 'path', d: `M ${bx} ${py} L ${bx} ${y}`, stroke: GREY4, strokeWidth: 2, strokeDasharray: '4 4' })
      connectors.push({ kind: 'circle', cx: bx, cy: py, r: 3, fill: GREY4 })
    }
  })

  const trackStyle = `position:relative;width:${trackW}px;height:${trackH}px;background:#fff`

  // ---- comparison table (vehicles = rows, specs = columns) ----
  const specCols: SpecCol[] = [
    { label: 'ボディタイプ' },
    { label: '発売年・世代' },
    { label: '全長×全幅×全高 (mm)' },
    { label: 'ホイールベース (mm)', num: true },
    { label: '車両重量 (kg)', num: true },
    { label: 'エンジン・排気量' },
    { label: '最高出力', num: true },
    { label: '駆動方式' },
    { label: '乗車定員' },
    { label: 'WLTC燃費 (km/L)', num: true },
    { label: '価格帯' },
  ].map((c) => ({ ...c, headStyle: '' }))

  interface VehRaw {
    name: string
    type: string
    vals: string[]
    nums: (number | null)[]
  }
  const vehicles: VehRaw[] = [
    { name: 'クラウン', type: 'クロスオーバーSUV', vals: ['クロスオーバーSUV', '2022年 / 16代目', '4930×1840×1540', '2,850', '1,750', '2.5L 直4 HEV', '234 PS', 'AWD (E-Four)', '5 名', '22.4', '435〜640万円'], nums: [null, null, null, 2850, 1750, null, 234, null, null, 22.4, null] },
    { name: 'ランドクルーザー', type: '本格SUV', vals: ['本格SUV', '2024年 / 250系', '4925×1980×1870', '2,850', '2,330', '2.8L ディーゼル', '204 PS', 'パートタイム4WD', '5 名', '11.0', '520〜735万円'], nums: [null, null, null, 2850, 2330, null, 204, null, null, 11.0, null] },
    { name: 'カローラ', type: 'セダン', vals: ['セダン', '2019年 / 12代目', '4495×1745×1435', '2,640', '1,370', '1.8L 直4 HEV', '140 PS', '2WD / E-Four', '5 名', '30.2', '201〜275万円'], nums: [null, null, null, 2640, 1370, null, 140, null, null, 30.2, null] },
    { name: 'RAV4', type: 'SUV', vals: ['SUV', '2019年 / 5代目', '4600×1855×1685', '2,690', '1,650', '2.5L 直4 HEV', '222 PS', '4WD (E-Four)', '5 名', '20.6', '294〜440万円'], nums: [null, null, null, 2690, 1650, null, 222, null, null, 20.6, null] },
    { name: 'アルファード', type: 'ミニバン', vals: ['ミニバン', '2023年 / 4代目', '4995×1850×1945', '3,000', '2,100', '2.5L 直4 HEV', '250 PS', 'AWD (E-Four)', '7 名', '17.7', '540〜872万円'], nums: [null, null, null, 3000, 2100, null, 250, null, null, 17.7, null] },
    { name: 'ヤリス', type: 'コンパクト', vals: ['コンパクト', '2020年 / 4代目', '3940×1695×1500', '2,550', '1,090', '1.5L 直3 HEV', '116 PS', '2WD / AWD', '5 名', '36.0', '150〜250万円'], nums: [null, null, null, 2550, 1090, null, 116, null, null, 36.0, null] },
  ]

  // per-column max/min index for numeric specs
  const colStats = specCols.map((c, ci) => {
    if (!c.num) return null
    const arr = vehicles.map((v) => v.nums[ci])
    let mx = -Infinity,
      mn = Infinity,
      maxI = -1,
      minI = -1
    arr.forEach((v, i) => {
      if (v != null && v > mx) {
        mx = v
        maxI = i
      }
      if (v != null && v < mn) {
        mn = v
        minI = i
      }
    })
    if (mx === mn) return null
    return { maxI, minI }
  })

  const GRID = 'display:grid;grid-template-columns:200px 128px 126px 158px 118px 116px 150px 130px 150px 82px 128px 148px'
  const compareHeadStyle = `${GRID};background:${GREY05};border-bottom:1px solid ${GREY2}`
  const headVehStyle = `position:sticky;left:0;z-index:3;background:${GREY05};padding:16px 18px;font-size:12px;font-weight:700;letter-spacing:0.06em;color:${GREY4};display:flex;align-items:flex-end;border-right:1px solid ${GREY2}`
  specCols.forEach((c) => {
    c.headStyle = `padding:16px 14px;border-left:1px solid ${GREY2};font-size:11.5px;font-weight:700;color:${GREY6};display:flex;align-items:flex-end;line-height:1.35`
  })

  const vehicleRows: VehicleRow[] = vehicles.map((v, vi) => {
    const cells: Cell[] = v.vals.map((text, ci) => {
      const st = colStats[ci]
      const isMax = !!st && st.maxI === vi
      const isMin = !!st && st.minI === vi
      let bg = 'transparent',
        tc = GREY9,
        tag = '',
        tagStyle = ''
      if (isMax) {
        bg = '#fdeef0'
        tc = RED
        tag = '最大'
        tagStyle = `font-size:8.5px;font-weight:800;letter-spacing:0.04em;color:#fff;background:${RED};padding:1px 6px;border-radius:var(--radius-pill)`
      } else if (isMin) {
        bg = GREY05
        tc = GREY4
        tag = '最小'
        tagStyle = `font-size:8.5px;font-weight:800;letter-spacing:0.04em;color:${GREY6};background:${GREY2};padding:1px 6px;border-radius:var(--radius-pill)`
      }
      return {
        text,
        tag,
        tagStyle,
        textStyle: `font-size:13.5px;font-weight:${isMax ? 700 : 500};color:${tc};letter-spacing:-0.01em`,
        style: `padding:14px 14px;border-left:1px solid ${GREY1};display:flex;align-items:center;flex-wrap:wrap;gap:7px;background:${bg}`,
      }
    })
    return {
      name: v.name,
      type: v.type,
      silColor: GREY6,
      cells,
      rowStyle: `${GRID};border-bottom:1px solid ${GREY1};background:#fff`,
      vehStyle: `position:sticky;left:0;z-index:2;background:#fff;padding:14px 18px;display:flex;align-items:center;gap:12px;border-right:1px solid ${GREY1}`,
      thumbStyle: `width:64px;height:40px;flex:none;background:${GREY1};border-radius:6px;display:flex;align-items:center;justify-content:center`,
    }
  })

  return { labelColStyle, labels, ticks, nodes, connectors, trackW, trackH, trackStyle, specCols, vehicleRows, compareHeadStyle, headVehStyle }
}
