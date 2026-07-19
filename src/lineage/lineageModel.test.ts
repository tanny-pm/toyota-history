import { describe, it, expect } from "vitest";
import { buildLineageView } from "./lineageModel";

describe("buildLineageView", () => {
  const view = buildLineageView();

  it("現行ノードは4件（カローラ / クラウン / プラド / ランドクルーザー）", () => {
    expect(view.nodes.filter((n) => n.isCurrent).length).toBe(4);
  });

  it("ホイールベース列は最大=アルファード・最小=ヤリスに色分けされる", () => {
    // specCols index 3 = ホイールベース (mm)
    const alphard = view.vehicleRows.find((v) => v.name === "アルファード");
    const yaris = view.vehicleRows.find((v) => v.name === "ヤリス");
    expect(alphard?.cells[3].tag).toBe("最大");
    expect(yaris?.cells[3].tag).toBe("最小");
  });

  it("WLTC燃費列は最大=ヤリス・最小=ランドクルーザーに色分けされる", () => {
    // specCols index 9 = WLTC燃費 (km/L)
    const yaris = view.vehicleRows.find((v) => v.name === "ヤリス");
    const landcruiser = view.vehicleRows.find((v) => v.name === "ランドクルーザー");
    expect(yaris?.cells[9].tag).toBe("最大");
    expect(landcruiser?.cells[9].tag).toBe("最小");
  });

  it("非数値の列にはタグが付かない（ボディタイプ列）", () => {
    // specCols index 0 = ボディタイプ（num フラグなし）
    expect(view.vehicleRows.every((v) => v.cells[0].tag === "")).toBe(true);
  });
});
