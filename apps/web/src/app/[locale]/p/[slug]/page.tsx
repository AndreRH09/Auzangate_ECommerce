import { getTranslations, setRequestLocale } from "next-intl/server";
import { BuyBox } from "@/components/BuyBox";
import { ProductGrid } from "@/components/ProductCard";
import type { Locale } from "@/i18n/routing";
import { getProduct } from "@/lib/api";
import { absolute, Breadcrumb, JsonLd, pageMeta } from "@/lib/seo";

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

/* eslint-disable @next/next/no-img-element -- ver ProductCard */
export default async function ProductPage({ params }: PageProps<"/[locale]/p/[slug]">) {
  const { locale: raw, slug } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);
  const [p, t, th] = await Promise.all([getProduct(slug, locale), getTranslations("Product"), getTranslations("Header")]);

  const prices = p.variants.map((v) => v.priceCents);
  const inStock = p.variants.some((v) => v.stock > 0);
  const specs = Object.entries(p.techSpecs);

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
            availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
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

      {/* Galería scroll-snap + buy-box flotante encima de la 2ª foto (design system §5) */}
      <div className="relative mt-4">
        <ul className="flex snap-x snap-mandatory gap-2 overflow-x-auto" aria-label={p.name}>
          {p.images.map((img, i) => (
            <li key={img.url} className="relative shrink-0 basis-full snap-start md:basis-[42vw]">
              <img
                src={img.url}
                alt={img.alt}
                width={img.width}
                height={img.height}
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : undefined}
                className={`aspect-[4/5] w-full bg-roca-clara ${img.width > img.height ? "object-contain p-8" : "object-cover"}`}
              />
              <span className="data absolute bottom-3 left-3 rounded-sm bg-granito/80 px-2 py-1 text-nieve md:hidden">
                {i + 1} / {p.images.length}
              </span>
            </li>
          ))}
        </ul>

        <div className="md:absolute md:top-6 md:right-8 md:max-h-[calc(100svh-112px)] md:w-[min(564px,39vw)] md:overflow-y-auto md:rounded-panel md:bg-glaciar/90 md:backdrop-blur-md">
          <BuyBox
            name={p.name}
            subtitle={p.subtitle}
            variants={p.variants}
            seriesPatch={p.series && { src: `/brand/parche-serie-${p.series.code.toLowerCase()}.svg`, name: p.series.name }}
          />
        </div>
      </div>

      <div className="mx-auto mt-16 max-w-[1600px] px-4 md:px-8">
        {/* Ficha técnica: acordeón exclusivo nativo (<details name>) en vez de tabs con JS */}
        <div className="max-w-3xl divide-y divide-linea border-y border-linea">
          {[
            { key: "details", body: <p className="max-w-prose">{p.description}</p> },
            {
              key: "materials",
              body: (
                <dl className="data grid grid-cols-[auto_1fr] gap-x-8 gap-y-2">
                  {specs.map(([k, v]) => (
                    <div key={k} className="contents">
                      <dt className="text-pizarra capitalize">{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
              ),
            },
            { key: "fit", body: <p className="max-w-prose">{t("fitText")}</p> },
            { key: "shipping", body: <p className="max-w-prose">{t("shippingText")}</p> },
          ].map((s, i) => (
            <details key={s.key} name="pdp-info" open={i === 0} className="group">
              <summary className="flex h-14 cursor-pointer list-none items-center justify-between font-semibold">
                {t(s.key as "details")}
                <span aria-hidden className="data transition-transform group-open:rotate-45 motion-reduce:transition-none">+</span>
              </summary>
              <div className="pb-6">{s.body}</div>
            </details>
          ))}
        </div>

        {p.related.length > 0 && (
          <section className="mt-24" aria-labelledby="h-rel">
            <h2 id="h-rel" className="mb-8 text-[clamp(28px,3vw,40px)] leading-none font-bold [font-stretch:110%]">{t("related")}</h2>
            <ProductGrid products={p.related} />
          </section>
        )}
      </div>
    </main>
  );
}
