import { css } from "../lib/css";
import type { LineageView } from "../lineage/lineageModel";
import { CarSilhouette } from "./CarSilhouette";

function Legend() {
  return (
    <div
      style={{
        display: "flex",
        gap: "20px",
        alignItems: "center",
        fontSize: "12.5px",
        color: "var(--text-secondary)",
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: "7px" }}>
        <span
          style={{
            width: "11px",
            height: "11px",
            borderRadius: "3px",
            background: "var(--toyota-red)",
          }}
        />
        現行
      </span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: "7px" }}>
        <span
          style={{
            width: "11px",
            height: "11px",
            borderRadius: "3px",
            background: "#fff",
            border: "1.5px solid var(--grey-300)",
          }}
        />
        過去世代
      </span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: "7px" }}>
        <span
          style={{
            width: "11px",
            height: "11px",
            borderRadius: "3px",
            background: "var(--grey-100)",
            border: "1.5px solid var(--grey-200)",
          }}
        />
        廃番
      </span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: "7px" }}>
        <span style={{ width: "16px", height: 0, borderTop: "2px dashed var(--grey-400)" }} />
        派生系統
      </span>
    </div>
  );
}

export function GenealogySection({ view }: { view: LineageView }) {
  return (
    <section id="genealogy" style={{ marginBottom: "88px", scrollMarginTop: "24px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "8px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.14em",
              color: "var(--toyota-red)",
              marginBottom: "8px",
            }}
          >
            GENEALOGY
          </div>
          <h2 style={{ margin: 0, fontSize: "32px", fontWeight: 700, letterSpacing: "-0.02em" }}>
            系譜の樹形図
          </h2>
        </div>
        <Legend />
      </div>
      <p style={{ margin: "0 0 20px", fontSize: "13px", color: "var(--text-tertiary)" }}>
        ← 横スクロールで年代を移動できます →
      </p>

      <div
        style={{
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          background: "var(--surface-card)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div style={{ display: "flex" }}>
          {/* fixed nameplate labels */}
          <div style={css(view.labelColStyle)}>
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "34px",
                display: "flex",
                alignItems: "center",
                paddingLeft: "16px",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: "var(--text-tertiary)",
                borderBottom: "1px solid var(--border-subtle)",
              }}
            >
              ネームプレート
            </div>
            {view.labels.map((lb, i) => (
              <div key={i} style={css(lb.style)}>
                <span
                  style={{ fontSize: "14px", fontWeight: 700, color: lb.color, lineHeight: 1.2 }}
                >
                  {lb.name}
                </span>
                <span style={css(lb.subStyle)}>{lb.sub}</span>
              </div>
            ))}
          </div>

          {/* scrollable track */}
          <div className="tl-scroll" style={{ overflowX: "auto", flex: 1 }}>
            <div style={css(view.trackStyle)}>
              {/* year gridlines + labels */}
              {view.ticks.map((tk, i) => (
                <div key={`tick-${i}`}>
                  <div style={css(tk.lineStyle)} />
                  <div style={css(tk.labelStyle)}>{tk.label}</div>
                </div>
              ))}

              {/* connector svg */}
              <div style={{ position: "absolute", top: 0, left: 0 }}>
                <svg
                  width={view.trackW}
                  height={view.trackH}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    pointerEvents: "none",
                    zIndex: 1,
                  }}
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
                    <span
                      style={{
                        position: "absolute",
                        top: "-9px",
                        right: "-8px",
                        background: "#fff",
                        color: "var(--toyota-red)",
                        border: "1.5px solid var(--toyota-red)",
                        fontSize: "9px",
                        fontWeight: 800,
                        letterSpacing: "0.06em",
                        padding: "1px 6px",
                        borderRadius: "var(--radius-pill)",
                      }}
                    >
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
