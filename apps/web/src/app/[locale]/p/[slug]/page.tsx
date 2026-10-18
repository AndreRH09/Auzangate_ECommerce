import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProductBuyBox } from "@/components/product/ProductBuyBox";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductSpecsAccordion } from "@/components/product/ProductSpecsAccordion";
import { RelatedProducts } from "@/components/product/RelatedProducts";
import { Breadcrumb } from "@/components/seo/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import type { Locale } from "@/i18n/routing";
import { getProduct } from "@/lib/api";
import { absolute, pageMeta } from "@/lib/seo";

export const revalidate = 3600;

// On-demand ISR: ninguna ficha se pre-genera en el build; la primera visita la cachea (revalidate + tag product:<slug>)
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/[locale]/p/[slug]">) {
  const { locale, slug } = await params;
  const [p, tm] = await Promise.all([getProduct(slug, locale as Locale), getTranslations({ locale, namespace: "Metadata" })]);
  // 70-160 caracteres (seo-check): si la descripción es corta se completa con la de la marca
  const description = p.description.length >= 70 ? p.description : `${p.description} ${tm("description")}`;
  return pageMeta({
    locale: locale as Locale,
    paths: { es: `/p/${p.alternates.es}`, en: `/p/${p.alternates.en}` },
    title: p.name,
    description: description.length > 160 ? `${description.slice(0, 157).trimEnd()}…` : description,
    image: p.images[0]?.url,
  });
}

// Ficha de producto (design system §5): breadcrumb · galería + buy-box flotante · ficha técnica · combina con
export default async function ProductPage({ params }: PageProps<"/[locale]/p/[slug]">) {
  const { locale: raw, slug } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);
  const [p, th] = await Promise.all([getProduct(slug, locale), getTranslations("Header")]);
  const prices = p.variants.map((v) => v.priceCents);

  return (
    <main className="pt-4">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: p.name,
          description: p.description,
          image: p.images.map((i) => absolute(i.url)),
          sku: p.variants[0]?.sku,
          brand: { "@type": "Brand", name: "AUZANGATE" },
          offers: {
            "@type": "Offer",
            priceCurrency: "PEN",
            price: (Math.min(...prices) / 100).toFixed(2),
            availability: p.variants.some((v) => v.stock > 0) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            url: absolute(`/${locale}/p/${p.slug}`),
          },
        }}
      />

      <div className="px-4 md:px-8">
        <Breadcrumb
          locale={locale}
          items={[
            { name: th("home"), href: "/" },
            ...(p.category.parent ? [{ name: p.category.parent.name, href: `/c/${p.category.parent.slug}` }] : []),
            { name: p.category.name, href: `/c/${p.category.slug}` },
            { name: p.name, href: `/p/${p.slug}` },
          ]}
        />
      </div>

      {/* buy-box flotante encima de la 2ª foto en desktop; debajo de la galería en mobile */}
      <div className="relative mt-4">
        <ProductGallery images={p.images} label={p.name} />
        <div className="md:absolute md:top-6 md:right-8 md:max-h-[calc(100svh-112px)] md:w-[min(564px,39vw)] md:overflow-y-auto md:rounded-panel md:bg-glaciar/90 md:backdrop-blur-md">
          <ProductBuyBox
            name={p.name}
            subtitle={p.subtitle}
            variants={p.variants}
            seriesPatch={p.series && { src: `/brand/parche-serie-${p.series.code.toLowerCase()}.svg`, name: p.series.name }}
          />
        </div>
      </div>

      <div className="mx-auto mt-16 max-w-[1600px] px-4 md:px-8">
        <ProductSpecsAccordion description={p.description} techSpecs={p.techSpecs} />
        <RelatedProducts products={p.related} />
      </div>
    </main>
  );
}
