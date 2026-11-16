import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProductListing, type ListingParams } from "@/components/catalog/ProductListing";
import type { Locale } from "@/i18n/routing";
import { getSeries } from "@/lib/api";
import { Breadcrumb } from "@/components/seo/Breadcrumb";
import { BrandMark, type BrandAsset } from "@/components/ui/BrandMark";
import { pageMeta } from "@/lib/seo";
import { getCaralContent, getSeriesIdentity, getSicanContent, getVicusContent } from "@/lib/series-identity";
import { CaralIdentity } from "@/components/series/CaralIdentity";
import { SeriesIdentity } from "@/components/series/SeriesIdentity";
import { SicanIdentity } from "@/components/series/SicanIdentity";
import { VicusIdentity } from "@/components/series/VicusIdentity";

async function find(locale: Locale, slug: string) {
  return (await getSeries(locale)).find((s) => s.slug === slug) ?? notFound();
}

export async function generateMetadata({ params }: PageProps<"/[locale]/s/[serie]">) {
  const { locale, serie } = await params;
  const s = await find(locale as Locale, serie);
  const t = await getTranslations({ locale, namespace: "Listing" });
  const tm = await getTranslations({ locale, namespace: "Metadata" });
  return pageMeta({
    locale: locale as Locale,
    paths: { es: `/s/${s.alternates.es}`, en: `/s/${s.alternates.en}` },
    title: t("series", { name: s.name }),
    description: `${s.description} ${tm("description")}`.slice(0, 160),
  });
}

export default async function SeriesPage({ params, searchParams }: PageProps<"/[locale]/s/[serie]">) {
  const { locale: raw, serie } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);
  const [s, t, th, ts] = await Promise.all([find(locale, serie), getTranslations("Listing"), getTranslations("Header"), getTranslations("Series")]);
  const breadcrumb = (
    <Breadcrumb
      locale={locale}
      items={[
        { name: th("home"), href: "/" },
        { name: t("series", { name: s.name }), href: `/s/${s.slug}` },
      ]}
    />
  );

  // serie con identidad de sub-marca (Wari, Vicús, Caral, Sicán): secciones de marca arriba y el listado debajo, en #productos
  const identity = getSeriesIdentity(s.code, locale);
  const brand = identity ? (
    <SeriesIdentity identity={identity} code={s.code} slug={s.slug} breadcrumb={breadcrumb} />
  ) : s.code === "VICUS" ? (
    <VicusIdentity content={getVicusContent(locale)} slug={s.slug} breadcrumb={breadcrumb} locale={locale} />
  ) : s.code === "CARAL" ? (
    <CaralIdentity content={getCaralContent(locale)} slug={s.slug} breadcrumb={breadcrumb} />
  ) : s.code === "SICAN" ? (
    <SicanIdentity content={getSicanContent(locale)} breadcrumb={breadcrumb} />
  ) : null;
  if (brand) {
    return (
      <main>
        {brand}
        <ProductListing
          locale={locale}
          path={`/s/${s.slug}`}
          base={{ series: s.slug }}
          params={(await searchParams) as ListingParams}
          title={ts("productsTitle")}
          belowIdentity
        />
      </main>
    );
  }

  return (
    <ProductListing
      locale={locale}
      path={`/s/${s.slug}`}
      base={{ series: s.slug }}
      params={(await searchParams) as ListingParams}
      title={t("series", { name: s.name })}
      intro={
        <div className="flex items-center gap-6 md:max-w-md">
          <BrandMark asset={`parche-serie-${s.code.toLowerCase()}` as BrandAsset} label={t("seriesCode", { code: s.name.toUpperCase() })} className="w-24 shrink-0" />
          <p className="text-pizarra">{s.description}</p>
        </div>
      }
      breadcrumb={breadcrumb}
    />
  );
}
