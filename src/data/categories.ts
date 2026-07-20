// カテゴリ体系の単一の正（樹形図のグループ分割に使う）。
// 配列 CATEGORIES の順序 = 樹形図での表示順（上→下）。
// genealogy.json の各 Nameplate は category にこのいずれかの id を持つ。

export const CATEGORIES = [
  { id: "sedan", title: "セダン" },
  { id: "coupe-sports", title: "クーペ・スポーツ" },
  { id: "suv", title: "SUV・クロカン" },
  { id: "minivan-wagon", title: "ミニバン・ワゴン" },
  { id: "compact", title: "コンパクト・ハッチ" },
  { id: "kei", title: "軽自動車" },
  { id: "commercial", title: "商用・トラック・バス" },
  { id: "lexus", title: "レクサス" },
] as const;

/** カテゴリ id のユニオン型（CATEGORIES の id から導出） */
export type CategoryId = (typeof CATEGORIES)[number]["id"];

/** 既知の category id かどうかの判定（データ整合検査に使う） */
const CATEGORY_IDS = new Set<string>(CATEGORIES.map((c) => c.id));
export const isCategoryId = (v: unknown): v is CategoryId =>
  typeof v === "string" && CATEGORY_IDS.has(v);

/** id → 表示名 */
export const categoryTitle = (id: CategoryId): string =>
  CATEGORIES.find((c) => c.id === id)?.title ?? id;
