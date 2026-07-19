import type { CSSProperties } from "react";

/**
 * インラインCSS文字列を React の style オブジェクトへ変換する。
 * デザインモック（Claude Design 由来）は style を文字列で持つため、
 * それをそのまま React で描画するためのヘルパ。
 */
export function css(style: string): CSSProperties {
  const out: Record<string, string> = {};
  for (const decl of style.split(";")) {
    const t = decl.trim();
    if (!t) continue;
    const i = t.indexOf(":");
    if (i < 0) continue;
    const prop = t.slice(0, i).trim();
    const val = t.slice(i + 1).trim();
    const key = prop.startsWith("--")
      ? prop
      : prop.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    out[key] = val;
  }
  return out as CSSProperties;
}
