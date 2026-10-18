import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProductListing, type ListingParams } from "@/components/catalog/ProductListing";
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
      <form action={`/${locale}/buscar`} role="search" className="mx-auto max-w-[1600px] px-4 pt-6 md:px-8">
        <label htmlFor="q" className="text-xs text-pizarra">{t("searchPrompt")}</label>
        <input id="q" name="q" type="search" defaultValue={q} className="mt-1 h-cta w-full max-w-lg rounded-sm border border-linea bg-nieve px-4 text-base" />
      </form>
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
