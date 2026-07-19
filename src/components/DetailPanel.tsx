import { useEffect, useState } from "react";
import type { LineageView, TreeNode } from "../lineage/lineageModel";
import { CarSilhouette } from "./CarSilhouette";

// 詳細パネルに抜粋表示する主要諸元（ラベルの前方一致で列を特定する。単位付きヘッダにも対応）。
const SPEC_PICKS = ["ボディタイプ", "全長", "エンジン", "最高出力", "価格帯"];

/**
 * 樹形図ノードのクリックで右からスライドインする詳細パネル。
 * 概要・解説文（node.overview）と、現行世代かつ諸元がある車種のみ主要諸元の抜粋を表示する。
 * node が null のときは画面外へ退避（App から常時マウントし、開閉をアニメーションさせる）。
 */
export function DetailPanel({
  node,
  view,
  onClose,
}: {
  node: TreeNode | null;
  view: LineageView;
  onClose: () => void;
}) {
  const open = node != null;
  // 閉じるアニメーション中も中身を見せるため、直近の非 null ノードを保持する。
  const [shown, setShown] = useState<TreeNode | null>(node);
  useEffect(() => {
    if (node) setShown(node);
  }, [node]);

  // Esc で閉じる。
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const n = shown;

  // 主要諸元の抜粋（現行世代 かつ 諸元表に同名車種がある場合のみ）。
  const specRow = n?.isCurrent ? view.vehicleRows.find((r) => r.name === n.label) : undefined;
  const specItems =
    specRow != null
      ? SPEC_PICKS.map((want) => {
          const ci = view.specCols.findIndex((c) => c.label.startsWith(want));
          if (ci < 0) return null;
          const text = specRow.cells[ci]?.text;
          if (!text) return null;
          return { label: view.specCols[ci].label, text };
        }).filter((x): x is { label: string; text: string } => x != null)
      : [];

  return (
    <>
      {/* バックドロップ（クリックで閉じる） */}
      <div
        aria-hidden
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/20"
        style={{
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity var(--duration-slow) var(--ease-standard)",
        }}
      />

      {/* パネル本体 */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={n ? `${n.label} ${n.genLabel} の詳細` : "詳細"}
        className="fixed top-0 right-0 z-50 flex h-full w-full max-w-[380px] flex-col rounded-l-lg border-l border-line bg-surface shadow-xl"
        style={{
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform var(--duration-slow) var(--ease-standard)",
        }}
      >
        {n && (
          <>
            {/* ヘッダー */}
            <div className="flex items-start gap-4 border-b border-line px-6 pt-6 pb-5">
              <div className="flex h-14 w-20 flex-none items-center justify-center rounded-md bg-surface-sunken">
                <CarSilhouette color={n.silColor} width="80%" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="m-0 text-xl font-bold tracking-[-0.01em] text-fg">{n.label}</h3>
                  {n.isCurrent && (
                    <span className="rounded-pill border-[1.5px] border-toyota-red bg-white px-[7px] py-px text-[9px] font-extrabold tracking-[0.06em] text-toyota-red">
                      現行
                    </span>
                  )}
                </div>
                <div className="mt-1 text-[13px] font-semibold text-fg-muted">
                  {n.genLabel}
                  <span className="text-fg-subtle">（{n.year}年）</span>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="閉じる"
                className="-mr-2 -mt-1 flex h-8 w-8 flex-none items-center justify-center rounded-md text-lg text-fg-subtle hover:bg-surface-sunken hover:text-fg"
              >
                ×
              </button>
            </div>

            {/* 中身（スクロール） */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <section>
                <div className="mb-2 text-[11px] font-bold tracking-[0.12em] text-toyota-red">
                  OVERVIEW
                </div>
                <p className="m-0 text-[14px] leading-[1.9] text-fg-muted">
                  {n.overview ?? "この世代の解説は準備中です。"}
                </p>
              </section>

              <section className="mt-8">
                <div className="mb-3 text-[11px] font-bold tracking-[0.12em] text-toyota-red">
                  SPECIFICATIONS
                </div>
                {specItems.length > 0 ? (
                  <dl className="m-0 divide-y divide-line rounded-md border border-line">
                    {specItems.map((s) => (
                      <div
                        key={s.label}
                        className="flex items-baseline justify-between gap-4 px-4 py-3"
                      >
                        <dt className="text-[12px] font-semibold text-fg-subtle">{s.label}</dt>
                        <dd className="m-0 text-right text-[14px] font-bold text-fg">{s.text}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="m-0 text-[13px] leading-[1.8] text-fg-subtle">
                    {view.vehicleRows.some((r) => r.name === n.label)
                      ? "諸元データは現行世代のみ掲載しています。"
                      : "この系統の諸元データは未掲載です。"}
                  </p>
                )}
                <p className="mt-3 mb-0 text-[11px] text-fg-subtle">
                  ※ 解説文・諸元はプロトタイプ用のダミーデータです。
                </p>
              </section>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
