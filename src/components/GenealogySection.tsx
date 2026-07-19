import { css } from "../lib/css";
import type { LineageView } from "../lineage/lineageModel";
import { CarSilhouette } from "./CarSilhouette";

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

export function GenealogySection({ view }: { view: LineageView }) {
  return (
    <section id="genealogy" className="mb-[88px] scroll-mt-6">
      <div className="mb-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 text-xs font-bold tracking-[0.14em] text-toyota-red">GENEALOGY</div>
          <h2 className="m-0 text-[32px] font-bold tracking-[-0.02em]">系譜の樹形図</h2>
        </div>
        <Legend />
      </div>
      <p className="mt-0 mb-5 text-[13px] text-fg-subtle">← 横スクロールで年代を移動できます →</p>

      <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-sm">
        <div className="flex">
          {/* fixed nameplate labels */}
          <div style={css(view.labelColStyle)}>
            <div className="absolute inset-x-0 top-0 flex h-[34px] items-center border-b border-line pl-4 text-[11px] font-bold tracking-[0.1em] text-fg-subtle">
              ネームプレート
            </div>
            {view.labels.map((lb, i) => (
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
            <div style={css(view.trackStyle)}>
              {/* year gridlines + labels */}
              {view.ticks.map((tk, i) => (
                <div key={`tick-${i}`}>
                  <div style={css(tk.lineStyle)} />
                  <div style={css(tk.labelStyle)}>{tk.label}</div>
                </div>
              ))}

              {/* connector svg */}
              <div className="absolute top-0 left-0">
                <svg
                  width={view.trackW}
                  height={view.trackH}
                  className="pointer-events-none absolute top-0 left-0 z-[1]"
                >
                  {view.connectors.map((c, i) => {
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
              {view.nodes.map((n, i) => (
                <div key={`node-${i}`} style={css(n.style)}>
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
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
