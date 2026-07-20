import { useState } from "react";
import { css } from "../lib/css";
import type { LineageGroup, LineageView, TreeNode } from "../lineage/lineageModel";
import { CarSilhouette } from "./CarSilhouette";

/** ノードを一意に識別するキー（ネームプレート名＋年） */
export const nodeKey = (n: Pick<TreeNode, "label" | "year">) => `${n.label}::${n.year}`;

function Legend() {
  return (
    <div className="flex items-center gap-5 text-[12.5px] text-fg-muted">
      <span className="inline-flex items-center gap-[7px]">
        <span className="h-[11px] w-[11px] rounded-[3px] bg-toyota-red" />
        現行
      </span>
      <span className="inline-flex items-center gap-[7px]">
        <span className="h-[11px] w-[11px] rounded-[3px] border-[1.5px] border-grey-300 bg-white" />
        過去世代
      </span>
      <span className="inline-flex items-center gap-[7px]">
        <span className="h-[11px] w-[11px] rounded-[3px] border-[1.5px] border-grey-200 bg-grey-100" />
        廃番
      </span>
      <span className="inline-flex items-center gap-[7px]">
        <span className="h-0 w-4 border-t-2 border-dashed border-grey-400" />
        派生系統
      </span>
    </div>
  );
}

/** カテゴリ1グループ分（見出し＋展開時のみ本体をマウント）。 */
function CategoryGroup({
  group,
  open,
  onToggle,
  selectedKey,
  onSelect,
}: {
  group: LineageGroup;
  open: boolean;
  onToggle: () => void;
  selectedKey?: string | null;
  onSelect?: (node: TreeNode) => void;
}) {
  return (
    <div className="border-b border-line last:border-b-0">
      {/* カテゴリ見出し（縦スクロール追従・クリックで開閉） */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="sticky top-0 z-30 flex w-full items-center gap-3 border-b border-line bg-surface px-5 py-3 text-left hover:bg-surface-sunken"
      >
        <span
          className="text-[11px] text-fg-subtle transition-transform"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
          aria-hidden
        >
          ▶
        </span>
        <span className="text-[15px] font-bold tracking-[-0.01em] text-fg">{group.title}</span>
        <span className="rounded-pill bg-surface-sunken px-2 py-px text-[11px] font-bold text-fg-subtle">
          {group.count}
        </span>
      </button>

      {/* 本体（展開時のみマウント＝実質的な仮想化） */}
      {open && (
        <div className="flex">
          {/* fixed nameplate labels */}
          <div style={css(group.labelColStyle)}>
            {group.labels.map((lb, i) => (
              <div key={i} style={css(lb.style)}>
                <span className="text-sm font-bold leading-[1.2]" style={{ color: lb.color }}>
                  {lb.name}
                </span>
                <span style={css(lb.subStyle)}>{lb.sub}</span>
              </div>
            ))}
          </div>

          {/* scrollable track */}
          <div className="tl-scroll flex-1 overflow-x-auto">
            <div style={css(group.trackStyle)}>
              {/* year gridlines + labels */}
              {group.ticks.map((tk, i) => (
                <div key={`tick-${i}`}>
                  <div style={css(tk.lineStyle)} />
                  <div style={css(tk.labelStyle)}>{tk.label}</div>
                </div>
              ))}

              {/* connector svg */}
              <div className="absolute top-0 left-0">
                <svg
                  width={group.trackW}
                  height={group.trackH}
                  className="pointer-events-none absolute top-0 left-0 z-[1]"
                >
                  {group.connectors.map((c, i) => {
                    if (c.kind === "line")
                      return (
                        <line
                          key={i}
                          x1={c.x1}
                          y1={c.y1}
                          x2={c.x2}
                          y2={c.y2}
                          stroke={c.stroke}
                          strokeWidth={c.strokeWidth}
                          strokeLinecap={c.strokeLinecap as "round"}
                        />
                      );
                    if (c.kind === "path")
                      return (
                        <path
                          key={i}
                          d={c.d}
                          stroke={c.stroke}
                          strokeWidth={c.strokeWidth}
                          strokeDasharray={c.strokeDasharray}
                          fill="none"
                        />
                      );
                    return <circle key={i} cx={c.cx} cy={c.cy} r={c.r} fill={c.fill} />;
                  })}
                </svg>
              </div>

              {/* nodes */}
              {group.nodes.map((n, i) => {
                const selected = selectedKey === nodeKey(n);
                return (
                  <div
                    key={`node-${i}`}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selected}
                    aria-label={`${n.label} ${n.genLabel}（${n.year}年）`}
                    onClick={() => onSelect?.(n)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelect?.(n);
                      }
                    }}
                    style={css(n.style)}
                    className={
                      selected
                        ? "outline outline-2 outline-offset-2 outline-toyota-red"
                        : "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-toyota-red"
                    }
                  >
                    <div style={css(n.thumbStyle)}>
                      <CarSilhouette color={n.silColor} width="78%" />
                    </div>
                    <span style={css(n.genStyle)}>{n.genLabel}</span>
                    {n.isCurrent && (
                      <span className="absolute -top-[9px] -right-[8px] rounded-pill border-[1.5px] border-toyota-red bg-white px-[6px] py-px text-[9px] font-extrabold tracking-[0.06em] text-toyota-red">
                        現行
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function GenealogySection({
  view,
  selectedKey,
  onSelect,
}: {
  view: LineageView;
  selectedKey?: string | null;
  onSelect?: (node: TreeNode) => void;
}) {
  // 折りたたみ状態。既定は先頭カテゴリのみ展開（初期 DOM 量を抑える）。
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    view.groups.length > 0 ? { [view.groups[0].id]: true } : {},
  );
  const setAll = (val: boolean) => setOpen(Object.fromEntries(view.groups.map((g) => [g.id, val])));

  return (
    <section id="genealogy" className="mb-[88px] scroll-mt-6">
      <div className="mb-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 text-xs font-bold tracking-[0.14em] text-toyota-red">GENEALOGY</div>
          <h2 className="m-0 text-[32px] font-bold tracking-[-0.02em]">系譜の樹形図</h2>
        </div>
        <Legend />
      </div>
      <div className="mt-0 mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 text-[13px] text-fg-subtle">
          カテゴリ見出しをクリックで開閉／← 横スクロールで年代を移動 →
        </p>
        <div className="flex items-center gap-2 text-[12px]">
          <button
            type="button"
            onClick={() => setAll(true)}
            className="rounded-md border border-line px-3 py-1 font-semibold text-fg-muted hover:bg-surface-sunken"
          >
            すべて展開
          </button>
          <button
            type="button"
            onClick={() => setAll(false)}
            className="rounded-md border border-line px-3 py-1 font-semibold text-fg-muted hover:bg-surface-sunken"
          >
            すべて畳む
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-line bg-surface shadow-sm">
        {view.groups.map((group) => (
          <CategoryGroup
            key={group.id}
            group={group}
            open={!!open[group.id]}
            onToggle={() => setOpen((prev) => ({ ...prev, [group.id]: !prev[group.id] }))}
            selectedKey={selectedKey}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  );
}
