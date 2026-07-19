// データ層（data/*.json）の整合性テスト。
// 手書きレイヤ（genealogy / lineup）と機械生成レイヤ（specs）の結合を守る番人。
// 壊れたデータを静的 import でブラウザに持ち込む前に、npm test / CI で落とす。

import { describe, it, expect } from "vitest";
import genealogyData from "../../data/genealogy.json";
import lineupData from "../../data/lineup.json";
import specsData from "../../data/specs.json";
import type { Genealogy, Lineup, Specs, PriceRange } from "./types";

const genealogy = genealogyData as Genealogy;
const lineup = lineupData as Lineup;
const specs = specsData as Specs;

function isPriceRange(v: unknown): v is PriceRange {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as PriceRange).min === "number" &&
    typeof (v as PriceRange).max === "number"
  );
}

describe("系譜レイヤ（genealogy.json）", () => {
  const labels = new Set(genealogy.nameplates.map((n) => n.label));

  it("ネームプレートが1件以上ある", () => {
    expect(genealogy.nameplates.length).toBeGreaterThan(0);
  });

  it("label は一意", () => {
    expect(labels.size).toBe(genealogy.nameplates.length);
  });

  for (const n of genealogy.nameplates) {
    describe(`${n.label}`, () => {
      it("世代リストは非空・昇順・重複なし", () => {
        expect(n.generations.length).toBeGreaterThan(0);
        const sorted = [...n.generations].sort((a, b) => a - b);
        expect(n.generations).toEqual(sorted);
        expect(new Set(n.generations).size).toBe(n.generations.length);
      });

      it("status は active / discontinued のいずれか", () => {
        expect(["active", "discontinued"]).toContain(n.status);
      });

      it("派生元(derivativeOf)は実在するネームプレートを指し、branchYear を伴う", () => {
        if (n.derivativeOf !== undefined) {
          expect(labels.has(n.derivativeOf)).toBe(true);
          expect(typeof n.branchYear).toBe("number");
        }
      });

      it("現行年(currentYear)は世代リストに含まれる", () => {
        if (n.currentYear !== undefined) {
          expect(n.generations).toContain(n.currentYear);
        }
      });
    });
  }
});

describe("諸元レイヤ（lineup.json ↔ specs.json）", () => {
  const vehicleNames = lineup.vehicles.map((v) => v.name);

  it("列定義(columns)が存在する", () => {
    expect(lineup.columns.length).toBeGreaterThan(0);
  });

  it("列の key は一意", () => {
    const keys = lineup.columns.map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("lineup の各車種に対応する specs エントリがある", () => {
    for (const name of vehicleNames) {
      expect(specs, `specs に「${name}」が無い`).toHaveProperty(name);
    }
  });

  it("specs に lineup 外の車種（孤児）が無い", () => {
    for (const name of Object.keys(specs)) {
      expect(vehicleNames, `lineup に無い specs「${name}」`).toContain(name);
    }
  });

  it("各車種の諸元は列定義に一致（キーの網羅と値の型）", () => {
    for (const name of vehicleNames) {
      const row = specs[name];
      for (const col of lineup.columns) {
        const v = row[col.key];
        expect(v, `${name}.${col.key} が欠損`).not.toBeUndefined();
        if (col.kind === "text") {
          expect(typeof v, `${name}.${col.key} は文字列であるべき`).toBe("string");
        } else if (col.kind === "number") {
          expect(
            typeof v === "number" && Number.isFinite(v),
            `${name}.${col.key} は有限数であるべき`,
          ).toBe(true);
        } else {
          // range
          expect(isPriceRange(v), `${name}.${col.key} は {min,max} であるべき`).toBe(true);
          const r = v as PriceRange;
          expect(Number.isFinite(r.min) && Number.isFinite(r.max)).toBe(true);
          expect(r.min).toBeLessThanOrEqual(r.max);
        }
      }
    }
  });

  it("wikipediaTitle / targetGen が全車種に設定されている", () => {
    for (const v of lineup.vehicles) {
      expect(v.wikipediaTitle.length).toBeGreaterThan(0);
      expect(v.targetGen.length).toBeGreaterThan(0);
    }
  });
});
