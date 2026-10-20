import { MagnifyingGlass, X } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProductListing, type ListingParams } from "@/components/catalog/ProductListing";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

// Resultados de búsqueda: noindex, follow (plan §3.4). Sin q lista todo el catálogo.
export async function generateMetadata({ params }: PageProps<"/[locale]/buscar">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Listing" });
  return { title: t("searchEmptyTitle"), robots: { index: false, follow: true } };
}

export default async function SearchPage({ params, searchParams }: PageProps<"/[locale]/buscar">) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);
  const sp = (await searchParams) as ListingParams & { q?: string };
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "";
  const t = await getTranslations("Listing");

  return (
    <>
      {/* la barra solo aparece con una búsqueda cargada; sin q se busca desde la lupa del header */}
      {q && (
        // mismo estilo que el input del SearchPanel: píldora con limpiar + buscar contiguos a la derecha
        <form action={`/${locale}/buscar`} role="search" className="relative mx-auto mt-6 w-[calc(100%-32px)] md:w-[25vw] md:min-w-80">
          <label htmlFor="q" className="sr-only">{t("searchPrompt")}</label>
          <input id="q" name="q" type="search" required maxLength={80} defaultValue={q} className="h-12 w-full rounded-full border border-linea bg-nieve pr-24 pl-5 [&::-webkit-search-cancel-button]:hidden" />
          <div className="absolute top-1/2 right-1 flex -translate-y-1/2 gap-1">
            <Link href="/buscar" className="grid size-10 place-items-center rounded-full text-pizarra hover:bg-glaciar hover:text-granito">
              <X size={18} aria-hidden />
              <span className="sr-only">{t("clear")}</span>
            </Link>
            <button className="grid size-10 place-items-center rounded-full bg-granito text-nieve">
              <MagnifyingGlass size={18} aria-hidden />
              <span className="sr-only">{t("searchPrompt")}</span>
            </button>
          </div>
        </form>
      )}
      <ProductListing
        locale={locale}
        path="/buscar"
        base={{ q: q || undefined }}
        params={sp}
        title={q ? t("searchTitle", { q }) : t("searchEmptyTitle")}
      />
    </>
  );
}
