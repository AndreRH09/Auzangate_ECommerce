import { X } from "@phosphor-icons/react/dist/ssr";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { ProductList } from "@/lib/api";
import { PopoverPanel } from "../ui/PopoverPanel";

export const FILTER_DRAWER_ID = "filters";

// Drawer lateral de filtros y orden (design system §4). Es un <form method="get">: al aplicar,
// los filtros quedan en la URL (funciona sin JS, se comparte y respeta el botón atrás).
export async function FilterDrawer({
  action,
  q,
  facets,
  current,
  clearHref,
}: {
  action: string;
  q?: string;
  facets: ProductList["facets"];
  current: { sort?: string; size?: string; color?: string; min?: string; max?: string };
  clearHref: string;
}) {
  const [t, th] = await Promise.all([getTranslations("Listing"), getTranslations("Header")]);
  const field = "h-11 w-full rounded-sm border border-linea bg-nieve px-3";
  const chip = "flex h-11 cursor-pointer items-center justify-center rounded-sm border border-linea";

  return (
    <PopoverPanel
      id={FILTER_DRAWER_ID}
      className="ml-auto h-dvh max-h-none w-full max-w-md overflow-y-auto border-0 border-l border-linea bg-glaciar p-0 text-granito [--from:100%_0]"
    >
      <form action={action} className="flex min-h-full flex-col">
        {q && <input type="hidden" name="q" value={q} />}
        <div className="flex h-14 items-center justify-between border-b border-linea px-4">
          <p className="data uppercase">{t("filter")}</p>
          <button type="button" popoverTarget={FILTER_DRAWER_ID} popoverTargetAction="hide" className="grid size-11 place-items-center">
            <X size={20} aria-hidden />
            <span className="sr-only">{th("close")}</span>
          </button>
        </div>

        <div className="flex-1 space-y-8 p-4">
          <fieldset>
            <legend className="font-semibold">{t("sort")}</legend>
            {(["new", "price_asc", "price_desc"] as const).map((s) => (
              <label key={s} className="flex h-11 items-center gap-3">
                <input type="radio" name="sort" value={s} defaultChecked={(current.sort ?? "new") === s} className="size-4 accent-granito" />
                {t(s === "new" ? "sortNew" : s === "price_asc" ? "sortPriceAsc" : "sortPriceDesc")}
              </label>
            ))}
          </fieldset>

          <fieldset>
            <legend className="font-semibold">{t("size")}</legend>
            <div className="mt-3 flex flex-wrap gap-1">
              {["", ...facets.sizes].map((s) => (
                <label key={s || "any"} className={`${chip} data min-w-11 bg-nieve px-3 has-checked:border-granito has-checked:bg-granito has-checked:text-nieve`}>
                  <input type="radio" name="size" value={s} defaultChecked={(current.size ?? "") === s} className="sr-only" />
                  {s || t("any")}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="font-semibold">{t("color")}</legend>
            <div className="mt-3 flex flex-wrap gap-1">
              <label className={`${chip} data bg-nieve px-3 has-checked:border-granito`}>
                <input type="radio" name="color" value="" defaultChecked={!current.color} className="sr-only" />
                {t("any")}
              </label>
              {facets.colors.map((c) => (
                <label key={c.hex} title={c.name} className={`${chip} size-11 has-checked:border-granito has-checked:outline has-checked:outline-granito`}>
                  <input type="radio" name="color" value={c.hex.slice(1)} defaultChecked={current.color === c.hex.slice(1)} className="sr-only" />
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
                <input name="min" type="number" inputMode="numeric" min={0} defaultValue={current.min} placeholder={String(facets.price.min / 100)} className={`${field} data mt-1 text-granito`} />
              </label>
              <label className="text-xs text-pizarra">
                {t("max")}
                <input name="max" type="number" inputMode="numeric" min={0} defaultValue={current.max} placeholder={String(facets.price.max / 100)} className={`${field} data mt-1 text-granito`} />
              </label>
            </div>
          </fieldset>
        </div>

        <div className="sticky bottom-0 grid grid-cols-2 gap-2 border-t border-linea bg-glaciar p-4">
          <Link href={clearHref} className="btn border border-granito">
            {t("clear")}
          </Link>
          <button className="btn bg-granito text-nieve hover:bg-pizarra">{t("apply")}</button>
        </div>
      </form>
    </PopoverPanel>
  );
}
