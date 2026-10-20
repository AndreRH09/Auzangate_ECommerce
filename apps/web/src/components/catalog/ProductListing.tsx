import { SlidersHorizontal } from "@phosphor-icons/react/dist/ssr";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getProducts } from "@/lib/api";
import { BrandMark } from "../ui/BrandMark";
import { FILTER_DRAWER_ID, FilterDrawer } from "./FilterDrawer";
import { Pagination } from "./Pagination";
import { ProductGrid } from "./ProductGrid";

export type ListingParams = Partial<Record<"sort" | "gender" | "size" | "color" | "min" | "max" | "cursor", string>>;

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
  intro,
}: {
  locale: Locale;
  path: string;
  base: { category?: string; series?: string; q?: string };
  params: ListingParams;
  breadcrumb?: ReactNode;
  title: string;
  /** bloque a la derecha del título (p. ej. parche y descripción de la serie) */
  intro?: ReactNode;
}) {
  const t = await getTranslations("Listing");
  // la URL es input del usuario: lo que no calce se ignora (la API respondería 400 y la página 500)
  const sort = ["new", "price_asc", "price_desc"].includes(params.sort ?? "") ? params.sort : undefined;
  const gender = ["men", "women"].includes(params.gender ?? "") ? params.gender : undefined;
  const size = params.size && params.size.length <= 8 ? params.size : undefined;
  const color = params.color && /^[0-9a-f]{6}$/i.test(params.color) ? params.color : undefined;
  const cursor = params.cursor && /^\d+$/.test(params.cursor) ? params.cursor : undefined;
  const { min, max } = params;
  const list = await getProducts(locale, {
    ...base,
    sort,
    gender,
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
  const active = [gender, size, color, min, max].filter(Boolean).length + (sort && sort !== "new" ? 1 : 0);
  const clearHref = href({ sort: undefined, gender: undefined, size: undefined, color: undefined, min: undefined, max: undefined, cursor: undefined });

  return (
    <main className="mx-auto max-w-[1600px] px-4 pt-6 md:px-8">
      {breadcrumb}
      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
        <h1 className="display text-[clamp(40px,6vw,96px)]">{title}</h1>
        {intro}
      </div>

      <div className="sticky top-14 z-20 mt-8 mb-4 flex items-center justify-between border-y border-linea bg-glaciar/90 py-1 backdrop-blur-md md:top-header">
        <p className="data uppercase" aria-live="polite">{t("count", { count: list.total })}</p>
        <button popoverTarget={FILTER_DRAWER_ID} className="data group flex h-11 items-center gap-2 uppercase">
          {t("filter")}
          {active > 0 && <span className="grid size-5 place-items-center rounded-sm bg-granito text-nieve">{active}</span>}
          <SlidersHorizontal size={16} aria-hidden className="transition-transform duration-200 ease-(--ease-fluid) group-hover:rotate-90" />
        </button>
      </div>

      {list.items.length ? (
        <ProductGrid products={list.items} />
      ) : (
        <div className="flex flex-col items-center py-24 text-center">
          <BrandMark asset="isotipo" className="h-16 text-linea" />
          <p className="mt-6 text-lg font-semibold">{t("emptyTitle")}</p>
          <p className="mt-1 text-pizarra">{t("empty")}</p>
          <div className="mt-8 flex gap-2">
            {active > 0 && <Link href={clearHref} className="btn border border-granito">{t("clear")}</Link>}
            <Link href="/buscar?sort=new" className="btn bg-granito text-nieve hover:bg-pizarra">{t("emptyCta")}</Link>
          </div>
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
        current={{ sort, gender, size, color, min, max }}
        clearHref={clearHref}
      />
    </main>
  );
}
