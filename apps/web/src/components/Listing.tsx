import { SlidersHorizontal, X } from "@phosphor-icons/react/dist/ssr";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getProducts } from "@/lib/api";
import { Popover } from "./Popover";
import { ProductGrid } from "./ProductCard";

export type ListingParams = Partial<Record<"sort" | "size" | "color" | "min" | "max" | "cursor", string>>;

const LIMIT = 24;
const soles = (v?: string) => (v && /^\d+$/.test(v) ? String(Number(v) * 100) : undefined);

// PLP compartida por /c/[category], /s/[serie] y /buscar. Filtros y orden viven en la URL (GET):
// funcionan sin JS, se pueden compartir y el botón atrás los respeta.
export async function Listing({
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
  const [t, th] = await Promise.all([getTranslations("Listing"), getTranslations("Header")]);
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
  const field = "h-11 w-full rounded-sm border border-linea bg-nieve px-3";

  return (
    <main className="mx-auto max-w-[1600px] px-4 pt-6 md:px-8">
      {breadcrumb}
      <h1 className="mt-4 text-[clamp(28px,3vw,40px)] leading-none font-bold [font-stretch:110%]">{title}</h1>

      <div className="mt-6 mb-4 flex items-center justify-between border-y border-linea py-2">
        <p className="data uppercase" aria-live="polite">{t("count", { count: list.total })}</p>
        <button popoverTarget="filters" className="data flex h-11 items-center gap-2 uppercase">
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

      {(offset > 0 || list.nextCursor) && (
        <nav className="mt-12 flex justify-center gap-2" aria-label="pagination">
          {offset > 0 && (
            <Link href={href({ cursor: offset - LIMIT > 0 ? String(offset - LIMIT) : undefined })} className="flex h-cta items-center rounded-md border border-granito px-6 font-semibold">
              {t("prev")}
            </Link>
          )}
          {list.nextCursor && (
            <Link href={href({ cursor: list.nextCursor })} className="flex h-cta items-center rounded-md bg-granito px-6 font-semibold text-nieve">
              {t("next")}
            </Link>
          )}
        </nav>
      )}

      {/* Drawer lateral de filtros (design system §4) */}
      <Popover
        id="filters"
        className="ml-auto h-dvh max-h-none w-full max-w-md overflow-y-auto border-0 border-l border-linea bg-glaciar p-0 text-granito"
      >
        <form action={`/${locale}${path}`} className="flex min-h-full flex-col">
          {base.q && <input type="hidden" name="q" value={base.q} />}
          <div className="flex h-14 items-center justify-between border-b border-linea px-4">
            <p className="data uppercase">{t("filter")}</p>
            <button type="button" popoverTarget="filters" popoverTargetAction="hide" className="grid size-11 place-items-center">
              <X size={20} aria-hidden />
              <span className="sr-only">{th("close")}</span>
            </button>
          </div>

          <div className="flex-1 space-y-8 p-4">
            <fieldset>
              <legend className="font-semibold">{t("sort")}</legend>
              {(["new", "price_asc", "price_desc"] as const).map((s) => (
                <label key={s} className="flex h-11 items-center gap-3">
                  <input type="radio" name="sort" value={s} defaultChecked={(sort ?? "new") === s} className="size-4 accent-granito" />
                  {t(s === "new" ? "sortNew" : s === "price_asc" ? "sortPriceAsc" : "sortPriceDesc")}
                </label>
              ))}
            </fieldset>

            <fieldset>
              <legend className="font-semibold">{t("size")}</legend>
              <div className="mt-3 flex flex-wrap gap-1">
                {["", ...list.facets.sizes].map((s) => (
                  <label key={s || "any"} className="data relative flex h-11 min-w-11 cursor-pointer items-center justify-center rounded-sm border border-linea bg-nieve px-3 has-checked:border-granito has-checked:bg-granito has-checked:text-nieve">
                    <input type="radio" name="size" value={s} defaultChecked={(size ?? "") === s} className="sr-only" />
                    {s || t("any")}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="font-semibold">{t("color")}</legend>
              <div className="mt-3 flex flex-wrap gap-1">
                <label className="data flex h-11 cursor-pointer items-center rounded-sm border border-linea bg-nieve px-3 has-checked:border-granito">
                  <input type="radio" name="color" value="" defaultChecked={!color} className="sr-only" />
                  {t("any")}
                </label>
                {list.facets.colors.map((c) => (
                  <label key={c.hex} title={c.name} className="flex size-11 cursor-pointer items-center justify-center rounded-sm border border-linea has-checked:border-granito has-checked:outline has-checked:outline-granito">
                    <input type="radio" name="color" value={c.hex.slice(1)} defaultChecked={color === c.hex.slice(1)} className="sr-only" />
                    <span className="h-3.5 w-6 rounded-sm" style={{ background: c.hex }} />
                    <span className="sr-only">{c.name}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="font-semibold">{t("price")}</legend>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <label className="text-xs text-pizarra">
                  {t("min")}
                  <input name="min" type="number" inputMode="numeric" min={0} defaultValue={min} placeholder={String(list.facets.price.min / 100)} className={`${field} data mt-1 text-granito`} />
                </label>
                <label className="text-xs text-pizarra">
                  {t("max")}
                  <input name="max" type="number" inputMode="numeric" min={0} defaultValue={max} placeholder={String(list.facets.price.max / 100)} className={`${field} data mt-1 text-granito`} />
                </label>
              </div>
            </fieldset>
          </div>

          <div className="sticky bottom-0 grid grid-cols-2 gap-2 border-t border-linea bg-glaciar p-4">
            <Link href={href({ sort: undefined, size: undefined, color: undefined, min: undefined, max: undefined, cursor: undefined })} className="flex h-cta items-center justify-center rounded-md border border-granito font-semibold">
              {t("clear")}
            </Link>
            <button className="h-cta rounded-md bg-granito font-semibold text-nieve">{t("apply")}</button>
          </div>
        </form>
      </Popover>
    </main>
  );
}
