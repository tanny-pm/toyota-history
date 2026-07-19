import { css } from "../lib/css";
import type { LineageView } from "../lineage/lineageModel";
import { CarSilhouette } from "./CarSilhouette";

export function CompareSection({ view }: { view: LineageView }) {
  return (
    <section id="compare" className="scroll-mt-6">
      <div className="mb-7">
        <div className="mb-2 text-xs font-bold tracking-[0.14em] text-toyota-red">
          SPECIFICATIONS
        </div>
        <h2 className="mt-0 mb-1.5 text-[32px] font-bold tracking-[-0.02em]">諸元比較表</h2>
        <p className="m-0 text-[15px] text-fg-muted">
          現行モデルの写真を縦に並べ、主要諸元を横に比較できます。
          <span className="text-fg-subtle">（各項目の最大・最小を色分け）</span>
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-line shadow-sm">
        <div className="tl-scroll overflow-x-auto">
          <div className="w-max">
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
                    <div className="text-[15px] font-bold tracking-[-0.01em] text-fg leading-[1.2]">
                      {v.name}
                    </div>
                    <div className="mt-0.5 text-[11px] font-semibold text-fg-subtle">{v.type}</div>
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
      <p className="mt-4 mb-0 text-xs text-fg-subtle">
        ※
        数値・年代・価格はすべてダミーデータです。実車の諸元とは異なります。横スクロールで全項目を確認できます。
      </p>
    </section>
  );
}
