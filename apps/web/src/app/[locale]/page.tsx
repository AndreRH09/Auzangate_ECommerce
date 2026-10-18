import { getTranslations, setRequestLocale } from "next-intl/server";
import { CategoryStrip } from "@/components/home/CategoryStrip";
import { HomeHero } from "@/components/home/HomeHero";
import { NewArrivalsCarousel } from "@/components/home/NewArrivalsCarousel";
import { NewsletterForm } from "@/components/home/NewsletterForm";
import { SeriesEditorial } from "@/components/home/SeriesEditorial";
import { JsonLd } from "@/components/seo/JsonLd";
import type { Locale } from "@/i18n/routing";
import { getCategories, getProducts, getSeries } from "@/lib/api";
import { absolute, pageMeta } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return pageMeta({ locale: locale as Locale, paths: { es: "", en: "" }, description: t("description") });
}

// Home (design system §7): hero · categorías · recién llegado · editorial de serie · newsletter
export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale); // cada página y layout lo llama: permite el render estático sin middleware

  const [t, tm, categories, series, latest] = await Promise.all([
    getTranslations("Home"),
    getTranslations("Metadata"),
    getCategories(locale),
    getSeries(locale),
    getProducts(locale, { sort: "new", limit: "8" }),
  ]);
  const wari = series.find((s) => s.code === "WARI");

  // 4 tiles: las 3 categorías padre + la serie Wari; la foto es la del producto más nuevo de cada una
  const firstImage = async (filter: Record<string, string>) => (await getProducts(locale, { ...filter, limit: "1" })).items[0]?.images[0];
  const tiles = await Promise.all([
    ...categories.map(async (c) => ({ name: c.name, href: `/c/${c.slug}`, image: await firstImage({ category: c.slug }) })),
    ...(wari ? [firstImage({ series: wari.slug }).then((image) => ({ name: wari.name, href: `/s/${wari.slug}`, image }))] : []),
  ]);

  return (
    <main>
      <JsonLd
        data={[
          { "@context": "https://schema.org", "@type": "Organization", name: "AUZANGATE", url: absolute("/"), logo: absolute("/brand/isotipo.svg") },
          { "@context": "https://schema.org", "@type": "WebSite", name: "AUZANGATE", url: absolute(`/${locale}`), description: tm("description"), inLanguage: locale },
        ]}
      />
      <HomeHero title={t("heroTitle")} links={categories.slice(0, 2).map((c) => ({ name: c.name, href: `/c/${c.slug}` }))} />
      <div className="mx-auto max-w-[1600px] px-4 md:px-8">
        <CategoryStrip title={t("categories")} tiles={tiles} />
        <NewArrivalsCarousel products={latest.items} />
        {wari && <SeriesEditorial series={wari} />}
        <NewsletterForm />
      </div>
    </main>
  );
}
