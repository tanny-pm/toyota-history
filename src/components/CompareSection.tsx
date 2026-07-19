import { css } from "../lib/css";
import type { LineageView } from "../lineage/lineageModel";
import { CarSilhouette } from "./CarSilhouette";

export function CompareSection({ view }: { view: LineageView }) {
  return (
    <section id="compare" style={{ scrollMarginTop: "24px" }}>
      <div style={{ marginBottom: "28px" }}>
        <div
          style={{
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.14em",
            color: "var(--toyota-red)",
            marginBottom: "8px",
          }}
        >
          SPECIFICATIONS
        </div>
        <h2
          style={{ margin: "0 0 6px", fontSize: "32px", fontWeight: 700, letterSpacing: "-0.02em" }}
        >
          諸元比較表
        </h2>
        <p style={{ margin: 0, fontSize: "15px", color: "var(--text-secondary)" }}>
          現行モデルの写真を縦に並べ、主要諸元を横に比較できます。
          <span style={{ color: "var(--text-tertiary)" }}>（各項目の最大・最小を色分け）</span>
        </p>
      </div>

      <div
        style={{
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div className="tl-scroll" style={{ overflowX: "auto" }}>
          <div style={{ width: "max-content" }}>
            <div style={css(view.compareHeadStyle)}>
              <div style={css(view.headVehStyle)}>車種</div>
              {view.specCols.map((col, i) => (
                <div key={i} style={css(col.headStyle)}>
                  {col.label}
                </div>
              ))}
            </div>
            {view.vehicleRows.map((v, vi) => (
              <div key={vi} style={css(v.rowStyle)}>
                <div style={css(v.vehStyle)}>
                  <div style={css(v.thumbStyle)}>
                    <CarSilhouette color={v.silColor} width="80%" />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "15px",
                        fontWeight: 700,
                        letterSpacing: "-0.01em",
                        color: "var(--text-primary)",
                        lineHeight: 1.2,
                      }}
                    >
                      {v.name}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "var(--text-tertiary)",
                        marginTop: "2px",
                      }}
                    >
                      {v.type}
                    </div>
                  </div>
                </div>
                {v.cells.map((cell, ci) => (
                  <div key={ci} style={css(cell.style)}>
                    <span style={css(cell.textStyle)}>{cell.text}</span>
                    {cell.tag && <span style={css(cell.tagStyle)}>{cell.tag}</span>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <p style={{ margin: "16px 0 0", fontSize: "12px", color: "var(--text-tertiary)" }}>
        ※
        数値・年代・価格はすべてダミーデータです。実車の諸元とは異なります。横スクロールで全項目を確認できます。
      </p>
    </section>
  );
}
