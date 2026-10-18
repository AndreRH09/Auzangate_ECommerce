"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import type { Product } from "@/lib/api";
import { formatPrice } from "@/lib/format";

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "U"];
const bySize = (a: string, b: string) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b);

// Panel de compra (design system §5): nombre, precio, color, talla (agotadas tachadas), CTA
// y en mobile la barra fija inferior con el precio dentro del botón.
export function ProductBuyBox({
  name,
  subtitle,
  variants,
  seriesPatch,
  color,
  onColorChange: setColor,
}: {
  name: string;
  subtitle: string;
  variants: Product["variants"];
  seriesPatch: { src: string; name: string } | null;
  color: string;
  onColorChange: (hex: string) => void;
}) {
  const t = useTranslations("Product");
  const colors = [...new Map(variants.map((v) => [v.colorHex, v])).values()];
  const [size, setSize] = useState<string | null>(null);
  const [message, setMessage] = useState(false);
  const sizesRef = useRef<HTMLFieldSetElement>(null);

  const ofColor = variants.filter((v) => v.colorHex === color).sort((a, b) => bySize(a.size, b.size));
  // talla única con stock (accesorios): elegida por defecto
  const selected = ofColor.find((v) => v.size === size) ?? (ofColor.length === 1 && ofColor[0]!.stock > 0 ? ofColor[0] : undefined);
  const price = formatPrice(selected?.priceCents ?? Math.min(...ofColor.map((v) => v.priceCents)));
  const colorName = ofColor[0]?.colorName;

  // ponytail: la bolsa llega en F2; por ahora el CTA valida la talla y avisa
  const add = () => {
    if (!selected) {
      sizesRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      sizesRef.current?.querySelector<HTMLInputElement>("input:not(:disabled)")?.focus();
      return;
    }
    setMessage(true);
  };

  return (
    <div className="bg-nieve p-4 md:bg-transparent md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium">{name}</h1>
          <p className="mt-1 text-pizarra">{subtitle}</p>
        </div>
        {seriesPatch && (
          // eslint-disable-next-line @next/next/no-img-element -- SVG de marca
          <img src={seriesPatch.src} alt={seriesPatch.name} width={64} height={64} className="size-16 shrink-0" />
        )}
      </div>
      <p className="data mt-4 text-lg">{price}</p>

      <fieldset className="mt-6">
        <legend className="text-sm">
          {t("color")}: <span className="font-semibold">{colorName}</span>
        </legend>
        <div className="mt-2 flex flex-wrap gap-1">
          {colors.map((v) => (
            <label key={v.colorHex} className="flex size-11 cursor-pointer items-center justify-center rounded-sm border border-linea has-checked:border-granito has-focus-visible:outline-2 has-focus-visible:outline-granito">
              <input
                type="radio"
                name="color"
                value={v.colorHex}
                checked={color === v.colorHex}
                onChange={() => { setColor(v.colorHex); setSize(null); setMessage(false); }}
                className="sr-only"
              />
              <span className="h-3.5 w-6 rounded-sm" style={{ background: v.colorHex }} />
              <span className="sr-only">{v.colorName}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset ref={sizesRef} className="mt-6">
        <legend className="text-sm">{t("size")}</legend>
        <div className="mt-2 flex flex-wrap gap-1">
          {ofColor.map((v) => {
            const out = v.stock <= 0;
            return (
              <label
                key={v.id}
                className={`data flex h-11 min-w-11 items-center justify-center rounded-sm border border-linea bg-nieve px-3 has-checked:border-granito has-checked:bg-granito has-checked:text-nieve has-focus-visible:outline-2 has-focus-visible:outline-granito ${out ? "cursor-not-allowed text-pizarra line-through" : "cursor-pointer"}`}
              >
                <input
                  type="radio"
                  name="size"
                  value={v.size}
                  disabled={out}
                  checked={selected?.size === v.size}
                  onChange={() => { setSize(v.size); setMessage(false); }}
                  className="sr-only"
                />
                <span aria-hidden={out}>{v.size}</span>
                {out && <span className="sr-only">{t("soldOutSize", { size: v.size })}</span>}
              </label>
            );
          })}
        </div>
        {selected && selected.stock <= 3 && <p className="data mt-2 text-cochinilla">{t("lowStock", { count: selected.stock })}</p>}
        {selected && <p className="data mt-2 text-pizarra">SKU {selected.sku}</p>}
      </fieldset>

      <button onClick={add} className="mt-6 h-cta w-full rounded-md bg-granito font-semibold text-nieve max-md:hidden">
        {selected ? t("addToBag") : t("chooseSize")}
      </button>
      <p role="status" className="mt-3 min-h-5 text-sm text-pizarra">{message ? t("soon") : ""}</p>

      {/* Mobile: barra sticky de 64 px con el precio dentro del botón (design system §6) */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-center border-t border-linea bg-nieve px-4 md:hidden">
        <button onClick={add} className="h-cta w-full rounded-md bg-granito font-semibold text-nieve">
          {selected ? t("addToBagShort", { price }) : t("chooseSize")}
        </button>
      </div>
      <div className="h-16 md:hidden" aria-hidden />
    </div>
  );
}
