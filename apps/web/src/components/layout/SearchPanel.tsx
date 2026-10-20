import { MagnifyingGlass, X } from "@phosphor-icons/react/dist/ssr";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getCategories, getProducts } from "@/lib/api";
import { PopoverPanel } from "../ui/PopoverPanel";
import { ProductPhoto } from "../ui/ProductPhoto";

export const SEARCH_PANEL_ID = "search";

// Card de búsqueda que abre la lupa del header (ref. Burton): entra con un leve barrido hacia la izquierda.
// Es un <form method="get">: busca solo al presionar Enter. Chips y categorías salen del catálogo real.
export async function SearchPanel({ locale }: { locale: Locale }) {
  const [t, categories] = await Promise.all([getTranslations("Header"), getCategories(locale)]);
  // foto de cada categoría = primera prenda que tenga; las vacías no se muestran
  const featured = (
    await Promise.all(categories.map(async (c) => ({ ...c, image: (await getProducts(locale, { category: c.slug, limit: "1" })).items[0]?.images[0] })))
  ).filter((c) => c.image);

  return (
    <PopoverPanel
      id={SEARCH_PANEL_ID}
      className="ml-auto h-dvh max-h-none w-full max-w-5xl overflow-y-auto border-0 border-l border-linea bg-glaciar p-0 text-granito [--from:48px_0] md:rounded-l-lg"
    >
      <div className="flex items-center gap-2 border-b border-linea px-4 py-6 md:px-12">
        <form action={`/${locale}/buscar`} role="search" className="relative w-full md:w-[25vw] md:min-w-72">
          <label htmlFor="search-q" className="sr-only">{t("searchLabel")}</label>
          <input
            id="search-q"
            name="q"
            type="search"
            required
            maxLength={80}
            placeholder={t("search")}
            className="h-12 w-full rounded-full border border-linea bg-nieve pr-12 pl-5 placeholder:text-pizarra"
          />
          <button className="absolute top-1/2 right-1 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-granito text-nieve">
            <MagnifyingGlass size={18} aria-hidden />
            <span className="sr-only">{t("searchLabel")}</span>
          </button>
        </form>
        <button popoverTarget={SEARCH_PANEL_ID} popoverTargetAction="hide" className="ml-auto grid size-11 shrink-0 place-items-center">
          <X size={20} aria-hidden />
          <span className="sr-only">{t("close")}</span>
        </button>
      </div>

      <section className="border-b border-linea px-4 py-8 md:px-12">
        <h2 className="text-xl font-semibold">{t("popular")}</h2>
        <ul className="mt-6 flex flex-wrap gap-2">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link href={`/buscar?q=${encodeURIComponent(c.name)}`} className="flex h-11 items-center rounded-full border border-linea px-5 hover:border-granito">
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="px-4 py-8 md:px-12">
        <h2 className="text-xl font-semibold">{t("featured")}</h2>
        {/* ponytail: carrusel con scroll-snap nativo en vez de flechas con JS */}
        <ul className="mt-6 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4">
          {featured.map((c) => (
            <li key={c.slug} className="w-[70%] shrink-0 snap-start md:w-[calc(50%-12px)]">
              <Link href={`/c/${c.slug}`} className="group block">
                <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-photo">
                  <ProductPhoto image={c.image!} alt="" className="absolute inset-0 size-full transition-transform duration-500 group-hover:scale-[1.02] motion-reduce:transition-none" />
                </div>
                <p className="mt-4 text-lg font-semibold">{c.name}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </PopoverPanel>
  );
}
