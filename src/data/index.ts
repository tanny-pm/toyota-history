// data/ 配下の JSON をビルド時に静的 import し、型を付けて再エクスポートする。
// 実行時 fetch なし・CORS なし・ローディング状態なしで buildLineageView() に渡す。
// JSON リテラルの推論型は string 止まりで NameplateStatus / SpecKind に合致しないため
// `as unknown as` で契約型（types.ts）に確定させる。データ整合はテストと npm run check で担保。

import genealogyJson from "../../data/genealogy.json";
import lineupJson from "../../data/lineup.json";
import specsJson from "../../data/specs.json";
import type { Genealogy, Lineup, Specs } from "./types";

export const genealogy = genealogyJson as unknown as Genealogy;
export const lineup = lineupJson as unknown as Lineup;
export const specs = specsJson as unknown as Specs;
