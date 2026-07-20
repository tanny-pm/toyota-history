import { describe, it, expect } from "vitest";
import { buildLineageView } from "./lineageModel";
import { genealogy, lineup, specs } from "../data";
import { CATEGORIES, categoryTitle } from "../data/categories";

describe("buildLineageView", () => {
  const view = buildLineageView(genealogy, lineup, specs);
  const allNodes = view.groups.flatMap((g) => g.nodes);
  const allConnectors = view.groups.flatMap((g) => g.connectors);

  // 表示列の並び（発売年・世代を先頭ボディタイプ直後に合成挿入）:
  // 0:ボディタイプ 1:発売年・世代 2:全長 3:全幅 4:全高 5:ホイールベース
  // 6:車両重量 7:エンジン 8:最高出力 9:駆動方式 10:乗車定員 11:WLTC燃費 12:価格帯

  describe("カテゴリ別グループ化", () => {
    it("グループは空でなく、各 id は既知カテゴリで CATEGORIES の順に並ぶ", () => {
      expect(view.groups.length).toBeGreaterThan(0);
      const order = CATEGORIES.map((c) => c.id);
      const idxs = view.groups.map((g) => order.indexOf(g.id));
      expect(idxs.every((i) => i >= 0)).toBe(true);
      expect(idxs).toEqual([...idxs].sort((a, b) => a - b));
    });

    it("各ネームプレートは厳密に1グループに属し、count の総和が総数と一致する", () => {
      const total = view.groups.reduce((s, g) => s + g.count, 0);
      expect(total).toBe(genealogy.nameplates.length);
      const nodeLabels = new Set(allNodes.map((n) => n.label));
      expect(nodeLabels.size).toBe(genealogy.nameplates.length);
    });

    it("group.title はカテゴリ表示名と一致する", () => {
      for (const g of view.groups) {
        expect(g.title).toBe(categoryTitle(g.id));
      }
    });

    it("各グループは正の高さと共有幅を持つ", () => {
      for (const g of view.groups) {
        expect(g.trackH).toBeGreaterThan(0);
        expect(g.trackW).toBe(view.axis.trackW);
      }
    });

    it("axis.Y0 は全世代年の最小、Y1 は現在年以上", () => {
      const min = Math.min(...genealogy.nameplates.flatMap((n) => n.generations));
      expect(view.axis.Y0).toBe(min);
      expect(view.axis.Y1).toBeGreaterThanOrEqual(2026);
    });
  });

  it("現行ノードは active な各ネームプレートの currentYear に1件ずつ付く", () => {
    const expected = genealogy.nameplates.filter(
      (n) => n.status === "active" && n.currentYear != null,
    ).length;
    expect(allNodes.filter((n) => n.isCurrent).length).toBe(expected);
    expect(expected).toBeGreaterThan(0);
  });

  it("各ノードの genLabel は n代目 形式で、先頭世代は 1代目", () => {
    expect(allNodes.every((n) => /^\d+代目$/.test(n.genLabel))).toBe(true);
    for (const np of genealogy.nameplates) {
      const first = allNodes.find((n) => n.label === np.label && n.year === np.generations[0]);
      expect(first?.genLabel).toBe("1代目");
    }
  });

  it("active かつ currentYear の世代ノードは isCurrent フラグを持つ", () => {
    for (const np of genealogy.nameplates) {
      if (np.status === "active" && np.currentYear != null) {
        const node = allNodes.find((n) => n.label === np.label && n.year === np.currentYear);
        expect(node?.isCurrent, `${np.label} の現行ノードが isCurrent でない`).toBe(true);
      }
    }
  });

  it("同一カテゴリ内の派生（プラド→ランクル、ともに SUV）はレーンから枝分かれする破線＋分岐円を持つ", () => {
    const suv = view.groups.find((g) => g.id === "suv");
    expect(suv).toBeDefined();
    expect(suv!.connectors.some((c) => c.kind === "path")).toBe(true);
    expect(suv!.connectors.some((c) => c.kind === "circle")).toBe(true);
  });

  it("カテゴリ跨ぎの派生（レビン=coupe-sports → 親カローラ=sedan）は分岐コネクタを描かない", () => {
    // 破線パス＋分岐円は「親が同一グループ内にいる派生」の数だけ生成される
    const drawn = allConnectors.filter((c) => c.kind === "path").length;
    const sameCatDerivatives = genealogy.nameplates.filter((n) => {
      if (n.derivativeOf == null || n.branchYear == null) return false;
      const parent = genealogy.nameplates.find((p) => p.label === n.derivativeOf);
      return parent != null && parent.category === n.category;
    }).length;
    expect(drawn).toBe(sameCatDerivatives);
    expect(allConnectors.filter((c) => c.kind === "circle").length).toBe(sameCatDerivatives);
  });

  it("ホイールベース列(idx5)は最大=アルファード・最小=ヤリスに色分けされる", () => {
    const alphard = view.vehicleRows.find((v) => v.name === "アルファード");
    const yaris = view.vehicleRows.find((v) => v.name === "ヤリス");
    expect(alphard?.cells[5].tag).toBe("最大");
    expect(yaris?.cells[5].tag).toBe("最小");
  });

  it("WLTC燃費列(idx11)は最大=ヤリス・最小=ランドクルーザーに色分けされる", () => {
    const yaris = view.vehicleRows.find((v) => v.name === "ヤリス");
    const landcruiser = view.vehicleRows.find((v) => v.name === "ランドクルーザー");
    expect(yaris?.cells[11].tag).toBe("最大");
    expect(landcruiser?.cells[11].tag).toBe("最小");
  });

  it("非数値の列（ボディタイプ idx0）にはタグが付かない", () => {
    expect(view.vehicleRows.every((v) => v.cells[0].tag === "")).toBe(true);
  });

  it("compare:false の乗車定員列(idx10)は数値でもタグが付かない", () => {
    expect(view.vehicleRows.every((v) => v.cells[10].tag === "")).toBe(true);
  });

  it("単位は列ヘッダに一元化される（全長 idx2 は『全長 (mm)』・価格帯 idx12 は『価格帯 (万円)』）", () => {
    expect(view.specCols[2].label).toBe("全長 (mm)");
    expect(view.specCols[12].label).toBe("価格帯 (万円)");
  });

  it("数値セルは桁区切り整形される（アルファードのホイールベース=3,000）", () => {
    const alphard = view.vehicleRows.find((v) => v.name === "アルファード");
    expect(alphard?.cells[5].text).toBe("3,000");
  });

  it("価格帯セルは min〜max で表示される（カローラ=230〜290）", () => {
    const corolla = view.vehicleRows.find((v) => v.name === "カローラ");
    expect(corolla?.cells[12].text).toBe("230〜290");
  });

  it("発売年・世代セル(idx1)は lineup.targetGen 由来", () => {
    const crown = view.vehicleRows.find((v) => v.name === "クラウン");
    expect(crown?.cells[1].text).toBe("2022年 / 16代目");
  });
});
