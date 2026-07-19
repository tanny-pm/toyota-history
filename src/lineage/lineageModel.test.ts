import { describe, it, expect } from "vitest";
import { buildLineageView } from "./lineageModel";
import { genealogy, lineup, specs } from "../data";

describe("buildLineageView", () => {
  const view = buildLineageView(genealogy, lineup, specs);

  // 表示列の並び（発売年・世代を先頭ボディタイプ直後に合成挿入）:
  // 0:ボディタイプ 1:発売年・世代 2:全長 3:全幅 4:全高 5:ホイールベース
  // 6:車両重量 7:エンジン 8:最高出力 9:駆動方式 10:乗車定員 11:WLTC燃費 12:価格帯

  it("現行ノードは active な各ネームプレートの currentYear に1件ずつ付く（4件）", () => {
    const expected = genealogy.nameplates.filter(
      (n) => n.status === "active" && n.currentYear != null,
    ).length;
    expect(view.nodes.filter((n) => n.isCurrent).length).toBe(expected);
    expect(expected).toBe(4);
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

  it("派生（プラド）のコネクタは親（ランドクルーザー）のレーンから枝分かれする破線を持つ", () => {
    // 破線パス＋分岐円は派生系統の数だけ生成される
    const paths = view.connectors.filter((c) => c.kind === "path");
    const circles = view.connectors.filter((c) => c.kind === "circle");
    const derivatives = genealogy.nameplates.filter(
      (n) => n.derivativeOf != null && n.branchYear != null,
    ).length;
    expect(paths.length).toBe(derivatives);
    expect(circles.length).toBe(derivatives);
  });
});
