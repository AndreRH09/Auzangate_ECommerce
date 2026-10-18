import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Card, Image } from "@/lib/api";
import { formatPrice } from "@/lib/format";

// Las fotos de estudio horizontales (renders) se muestran enteras; las verticales llenan el 4:5.
const fit = (img: Image) => (img.width > img.height ? "object-contain p-4" : "object-cover");

/* eslint-disable @next/next/no-img-element -- ponytail: <img> nativo con lazy loading; next/image necesita
   el binding de Cloudflare Images en el worker. Activarlo cuando las fotos reales vivan en R2. */
export async function ProductCard({ product: p, priority = false }: { product: Card; priority?: boolean }) {
  const t = await getTranslations("Product");
  const [first, second] = p.images;
  const extraColors = p.colors.length - 4;

  return (
    <article className="group">
      <Link href={`/p/${p.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-roca-clara">
          {first && (
            <img
              src={first.url}
              alt={first.alt}
              width={first.width}
              height={first.height}
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : undefined}
              className={`absolute inset-0 size-full ${fit(first)}`}
            />
          )}
          {second && (
            // 2ª foto en hover: sin zoom ni sombra (design system §4)
            <img
              src={second.url}
              alt=""
              width={second.width}
              height={second.height}
              loading="lazy"
              className={`absolute inset-0 size-full opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:transition-none ${fit(second)}`}
            />
          )}
          {(p.soldOut || p.isNew) && (
            <span className="label absolute top-2 left-2 text-cochinilla">{p.soldOut ? t("soldOut") : t("new")}</span>
          )}
        </div>

        <ul className="mt-3 flex items-center gap-1" aria-label={p.colors.map((c) => c.name).join(", ")}>
          {p.colors.slice(0, 4).map((c) => (
            <li key={c.hex} className="h-3.5 w-6 rounded-sm border border-linea" style={{ background: c.hex }} />
          ))}
          {extraColors > 0 && <li className="data text-pizarra">{t("colorsMore", { count: extraColors })}</li>}
        </ul>
        <h3 className="mt-2 text-sm font-semibold uppercase">{p.name}</h3>
        <p className="mt-0.5 text-xs text-pizarra">{p.subtitle}</p>
        <p className="data mt-1">{formatPrice(p.priceCents)}</p>
      </Link>
    </article>
  );
}

export function ProductGrid({ products }: { products: Card[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-1 gap-y-8 md:grid-cols-4">
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} priority={i < 4} />
        </li>
      ))}
    </ul>
  );
}
