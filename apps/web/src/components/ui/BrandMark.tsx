import type { CSSProperties } from "react";

// Proporción ancho/alto de cada SVG de public/brand (de su viewBox), para reservar el espacio exacto.
const ASSETS = {
  isotipo: 1,
  wordmark: 1100 / 208.91,
  "lockup-horizontal": 1454.77 / 356.5,
  parche: 1,
  "parche-serie-caral": 1,
  "parche-serie-wari": 1,
  "parche-serie-sican": 1,
  "parche-serie-vicus": 1,
  "parche-serie-nasca": 1,
} as const;

export type BrandAsset = keyof typeof ASSETS;

// Pieza de marca en una sola tinta: toma el color del texto (text-granito / text-nieve).
// Se dimensiona por alto o por ancho con className; la otra medida sale de la proporción.
export function BrandMark({ asset, label, className = "" }: { asset: BrandAsset; label?: string; className?: string }) {
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`brand-mark ${className}`}
      style={{ "--mark": `url(/brand/${asset}.svg)`, aspectRatio: ASSETS[asset] } as CSSProperties}
    />
  );
}
