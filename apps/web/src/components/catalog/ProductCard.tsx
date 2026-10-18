import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Card } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { ProductPhoto } from "../ui/ProductPhoto";

// Card de catálogo (design system §4): foto 4:5 con 2ª foto en hover, swatches, nombre, dato técnico, precio mono.
export async function ProductCard({ product: p, priority = false }: { product: Card; priority?: boolean }) {
  const t = await getTranslations("Product");
  const [first, second] = p.images;
  const extraColors = p.colors.length - 4;

  return (
    <article className="group">
      <Link href={`/p/${p.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-photo">
          {first && <ProductPhoto image={first} priority={priority} className="absolute inset-0 size-full" />}
          {second && (
            // 2ª foto en hover: sin zoom ni sombra
            <ProductPhoto
              image={second}
              alt=""
              className="absolute inset-0 size-full opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:transition-none"
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
