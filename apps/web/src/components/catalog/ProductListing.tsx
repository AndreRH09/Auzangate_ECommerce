import { SlidersHorizontal } from "@phosphor-icons/react/dist/ssr";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getProducts } from "@/lib/api";
import { FILTER_DRAWER_ID, FilterDrawer } from "./FilterDrawer";
import { Pagination } from "./Pagination";
import { ProductGrid } from "./ProductGrid";

export type ListingParams = Partial<Record<"sort" | "size" | "color" | "min" | "max" | "cursor", string>>;

const LIMIT = 24;
const soles = (v?: string) => (v && /^\d+$/.test(v) ? String(Number(v) * 100) : undefined);

// Página de listado (PLP) compartida por /c/[category], /s/[serie] y /buscar:
// título + barra "N PRENDAS · FILTRAR + ORDENAR" + grilla + paginación + drawer de filtros.
export async function ProductListing({
  locale,
  path,
  base,
  params,
  breadcrumb,
  title,
}: {
  locale: Locale;
  path: string;
  base: { category?: string; series?: string; q?: string };
  params: ListingParams;
  breadcrumb?: ReactNode;
  title: string;
}) {
  const t = await getTranslations("Listing");
  // la URL es input del usuario: lo que no calce se ignora (la API respondería 400 y la página 500)
  const sort = ["new", "price_asc", "price_desc"].includes(params.sort ?? "") ? params.sort : undefined;
  const size = params.size && params.size.length <= 8 ? params.size : undefined;
  const color = params.color && /^[0-9a-f]{6}$/i.test(params.color) ? params.color : undefined;
  const cursor = params.cursor && /^\d+$/.test(params.cursor) ? params.cursor : undefined;
  const { min, max } = params;
  const list = await getProducts(locale, {
    ...base,
    sort,
    size,
    color: color && `#${color}`,
    minPrice: soles(min),
    maxPrice: soles(max),
    cursor,
    limit: String(LIMIT),
  });

  const href = (patch: ListingParams) => {
    const qs = new URLSearchParams(Object.entries({ q: base.q, ...params, ...patch }).filter((e): e is [string, string] => !!e[1]));
    return `${path}${qs.size ? `?${qs}` : ""}`;
  };
  const offset = Number(cursor) || 0;

  return (
    <main className="mx-auto max-w-[1600px] px-4 pt-6 md:px-8">
      {breadcrumb}
      <h1 className="section-title mt-4">{title}</h1>

      <div className="mt-6 mb-4 flex items-center justify-between border-y border-linea py-2">
        <p className="data uppercase" aria-live="polite">{t("count", { count: list.total })}</p>
        <button popoverTarget={FILTER_DRAWER_ID} className="data flex h-11 items-center gap-2 uppercase">
          {t("filter")}
          <SlidersHorizontal size={16} aria-hidden />
        </button>
      </div>

      {list.items.length ? (
        <ProductGrid products={list.items} />
      ) : (
        <div className="py-24 text-center">
          <p>{t("empty")}</p>
          <Link href="/" className="mt-4 inline-block underline underline-offset-4">{t("emptyCta")}</Link>
        </div>
      )}

      <Pagination
        prevHref={offset > 0 ? href({ cursor: offset - LIMIT > 0 ? String(offset - LIMIT) : undefined }) : null}
        nextHref={list.nextCursor ? href({ cursor: list.nextCursor }) : null}
      />

      <FilterDrawer
        action={`/${locale}${path}`}
        q={base.q}
        facets={list.facets}
        current={{ sort, size, color, min, max }}
        clearHref={href({ sort: undefined, size: undefined, color: undefined, min: undefined, max: undefined, cursor: undefined })}
      />
    </main>
  );
}
