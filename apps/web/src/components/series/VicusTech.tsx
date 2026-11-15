"use client";

import { useState } from "react";
import type { SeriesMedia } from "@/lib/series-identity";
import { SeriesVideo } from "./SeriesVideo";

type Item = { title: string; body: string; media?: SeriesMedia };

// Explorador de tecnología (maquetado Vicús): lista numerada a la izquierda, la pieza de motion grande a la derecha.
// Patrón de pestañas WAI-ARIA: flechas arriba/abajo mueven la selección.
export function VicusTech({ items }: { items: Item[] }) {
  const [sel, setSel] = useState(0);
  const pad = (n: number) => String(n).padStart(2, "0");
  const move = (to: number) => {
    const next = (to + items.length) % items.length;
    setSel(next);
    document.getElementById(`vicus-tab-${next}`)?.focus();
  };

  return (
    <div className="grid gap-8 md:grid-cols-3">
      <div role="tablist" aria-orientation="vertical" className="flex flex-col">
        {items.map((it, i) => {
          const on = i === sel;
          return (
            <button
              key={it.title}
              id={`vicus-tab-${i}`}
              role="tab"
              type="button"
              aria-selected={on}
              aria-controls="vicus-tech-panel"
              tabIndex={on ? 0 : -1}
              onClick={() => setSel(i)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                  e.preventDefault();
                  move(e.key === "ArrowDown" ? i + 1 : i - 1);
                }
              }}
              className={`grid cursor-pointer grid-cols-[48px_1fr] gap-x-4 gap-y-1 py-6 text-left last:border-b last:border-linea ${on ? "border-t-2 border-granito" : "border-t border-linea text-pizarra hover:text-granito"}`}
            >
              <span className="data pt-1.5">{pad(i + 1)}</span>
              <span className="text-[22px] font-bold tracking-[0.02em]">{it.title}</span>
              {on && (
                <>
                  <span />
                  <span className="text-[15px] leading-normal text-pizarra">{it.body}</span>
                </>
              )}
            </button>
          );
        })}
      </div>
      <div id="vicus-tech-panel" role="tabpanel" aria-labelledby={`vicus-tab-${sel}`} className="relative min-h-[320px] overflow-hidden bg-granito md:col-span-2 md:min-h-[520px]">
        <SeriesVideo key={sel} media={items[sel].media} className="absolute inset-0" />
        <span className="data absolute right-4 bottom-4 tracking-[0.08em] text-roca-clara">{`${pad(sel + 1)} / ${pad(items.length)}`}</span>
      </div>
    </div>
  );
}
