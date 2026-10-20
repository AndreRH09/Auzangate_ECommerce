"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import type { Card } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { ProductPhoto } from "../ui/ProductPhoto";

const STEP_MS = 1500;

// Card de catálogo (design system §4): foto 4:5, swatches, nombre, dato técnico, precio mono.
// Swatch = cambia las fotos al color elegido sin navegar. Hover sobre la foto = recorre las fotos de ese color;
// al salir vuelve a la portada. Foto y bloque de texto llevan al detalle.
export function ProductCard({ product: p, priority = false }: { product: Card; priority?: boolean }) {
  const t = useTranslations("Product");
  const [color, setColor] = useState(() => p.images.find((i) => i.colorHex)?.colorHex ?? p.colors[0]?.hex ?? null);
  const [index, setIndex] = useState(0);
  const [hover, setHover] = useState(false);
  // las fotos apiladas están en el viewport, así que lazy no las frena: solo se montan tras el primer hover
  const [armed, setArmed] = useState(false);

  // fotos del color + las de "todos los colores"; si el color no tiene propias, todas
  const own = p.images.filter((i) => i.colorHex === color);
  const photos = own.length ? [...own, ...p.images.filter((i) => !i.colorHex)] : p.images;
  const extraColors = p.colors.length - 4;

  useEffect(() => {
    if (!hover || photos.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % photos.length), STEP_MS);
    return () => clearInterval(id);
  }, [hover, photos.length]);

  return (
    <article>
      {/* foto duplica el link del nombre: fuera del tab order y del árbol a11y */}
      <Link
        href={`/p/${p.slug}`}
        tabIndex={-1}
        aria-hidden
        className="relative block aspect-[4/5] overflow-hidden rounded-sm bg-photo"
        onMouseEnter={() => {
          setHover(true);
          setArmed(true);
        }}
        onMouseLeave={() => {
          setHover(false);
          setIndex(0);
        }}
      >
        {photos.map((img, i) => (i === 0 || armed) && (
          <ProductPhoto
            key={img.url}
            image={img}
            alt={i === 0 ? img.alt : ""}
            priority={priority && i === 0}
            className={`absolute inset-0 size-full transition-opacity duration-500 motion-reduce:transition-none ${i === index ? "opacity-100" : "opacity-0"}`}
          />
        ))}
        {(p.soldOut || p.isNew) && <span className="label absolute top-2 left-2 text-cochinilla">{p.soldOut ? t("soldOut") : t("new")}</span>}
        {photos.length > 1 && (
          <ol className="absolute inset-x-0 bottom-2 flex justify-center gap-1" aria-hidden>
            {photos.map((img, i) => (
              <li key={img.url} className={`h-0.5 w-4 rounded-full transition-colors ${i === index ? "bg-granito" : "bg-granito/20"}`} />
            ))}
          </ol>
        )}
      </Link>

      <ul className="mt-3 flex items-center gap-1">
        {p.colors.slice(0, 4).map((c) => (
          <li key={c.hex}>
            <button
              type="button"
              onClick={() => {
                setColor(c.hex);
                setIndex(0);
              }}
              aria-label={c.name}
              aria-pressed={c.hex === color}
              title={c.name}
              className="grid h-6 w-7 place-items-center"
            >
              <span className={`h-3.5 w-6 rounded-sm border ${c.hex === color ? "border-granito outline outline-offset-1 outline-granito" : "border-linea"}`} style={{ background: c.hex }} />
            </button>
          </li>
        ))}
        {extraColors > 0 && <li className="data text-pizarra">{t("colorsMore", { count: extraColors })}</li>}
      </ul>
      <Link href={`/p/${p.slug}`} className="block">
        <h3 className="mt-2 text-sm font-semibold uppercase hover:underline">{p.name}</h3>
        <p className="mt-0.5 text-xs text-pizarra">{p.subtitle}</p>
        <p className="data mt-1">{formatPrice(p.priceCents)}</p>
      </Link>
    </article>
  );
}
