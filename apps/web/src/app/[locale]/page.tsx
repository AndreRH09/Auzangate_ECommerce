import { getTranslations, setRequestLocale } from "next-intl/server";
import { Newsletter } from "@/components/Newsletter";
import { ProductCard } from "@/components/ProductCard";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getCategories, getProducts, getSeries } from "@/lib/api";
import { absolute, JsonLd, pageMeta } from "@/lib/seo";

export const revalidate = 3600;

// ponytail: foto de hero MOCK (picsum) hasta tener fotografía real de campaña (REQUISITOS §6.3)
const HERO = "https://picsum.photos/seed/auzangate-hero/2400/1350";
const EDITORIAL = "https://picsum.photos/seed/auzangate-wari/1600/2000";

export async function generateMetadata({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return pageMeta({ locale: locale as Locale, paths: { es: "", en: "" }, description: t("description") });
}

export default async function Home({ params }: PageProps<"/[locale]">) {
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

  // Franja de 4: las 3 categorías padre + la serie Wari; la foto es la del producto más nuevo de cada una
  const tiles = await Promise.all([
    ...categories.map(async (c) => ({ name: c.name, href: `/c/${c.slug}`, img: (await getProducts(locale, { category: c.slug, limit: "1" })).items[0]?.images[0] })),
    ...(wari ? [{ name: wari.name, href: `/s/${wari.slug}`, img: (await getProducts(locale, { series: wari.slug, limit: "1" })).items[0]?.images[0] }] : []),
  ]);

  return (
    <main>
      <JsonLd
        data={[
          { "@context": "https://schema.org", "@type": "Organization", name: "AUZANGATE", url: absolute("/"), logo: absolute("/brand/isotipo.svg") },
          { "@context": "https://schema.org", "@type": "WebSite", name: "AUZANGATE", url: absolute(`/${locale}`), description: tm("description"), inLanguage: locale },
        ]}
      />

      {/* 1. Hero a sangre, sin carrusel; titular abajo a la izquierda */}
      <section className="relative h-[calc(100svh-56px)] min-h-[480px] overflow-hidden bg-granito md:h-[calc(100svh-64px)]">
        {/* eslint-disable-next-line @next/next/no-img-element -- ver ProductCard */}
        <img src={HERO} alt="" width={2400} height={1350} fetchPriority="high" className="absolute inset-0 size-full object-cover opacity-80" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1600px] px-4 pb-10 text-nieve md:px-8 md:pb-16">
          <h1 className="display max-w-[12ch] text-[clamp(44px,9vw,160px)] [font-stretch:110%]">{t("heroTitle")}</h1>
          <div className="mt-6 flex gap-2">
            {categories.slice(0, 2).map((c) => (
              <Link key={c.slug} href={`/c/${c.slug}`} className="inline-flex h-cta items-center rounded-md bg-nieve px-6 font-semibold text-granito">
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1600px] px-4 md:px-8">
        {/* 2. Franja de categorías: foto + nombre debajo, sin texto encima */}
        <section className="mt-16" aria-labelledby="h-cat">
          <h2 id="h-cat" className="sr-only">{t("categories")}</h2>
          <ul className="grid grid-cols-2 gap-1 md:grid-cols-4">
            {tiles.map((tile) => (
              <li key={tile.href}>
                <Link href={tile.href} className="group block">
                  <div className="aspect-[4/5] overflow-hidden rounded-sm bg-roca-clara">
                    {tile.img && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={tile.img.url} alt="" loading="lazy" width={tile.img.width} height={tile.img.height}
                        className={`size-full ${tile.img.width > tile.img.height ? "object-contain p-4" : "object-cover"}`} />
                    )}
                  </div>
                  <p className="mt-3 text-sm font-semibold group-hover:underline">{tile.name}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* 3. Recién llegado: carrusel manual (scroll-snap nativo) */}
        <section className="mt-24" aria-labelledby="h-new">
          <div className="flex items-end justify-between">
            <h2 id="h-new" className="text-[clamp(28px,3vw,40px)] leading-none font-bold [font-stretch:110%]">{t("newArrivals")}</h2>
            <Link href="/buscar?sort=new" className="data uppercase underline-offset-4 hover:underline">{t("seeAll")}</Link>
          </div>
          <ul className="mt-8 flex snap-x snap-mandatory gap-1 overflow-x-auto pb-4">
            {latest.items.map((p) => (
              <li key={p.id} className="w-[46vw] shrink-0 snap-start md:w-[calc((100%-12px)/4)]">
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        </section>

        {/* 4. Bloque editorial de serie con 3 datos mono */}
        {wari && (
          <section className="mt-24 grid items-end gap-8 md:grid-cols-2" aria-labelledby="h-ed">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={EDITORIAL} alt="" loading="lazy" width={1600} height={2000} className="aspect-[4/5] w-full rounded-sm bg-roca-clara object-cover" />
            <div className="pb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/parche-serie-wari.svg" alt="" width={96} height={96} className="size-24" />
              <h2 id="h-ed" className="mt-6 text-[clamp(28px,3vw,40px)] leading-none font-bold [font-stretch:110%]">{t("editorialTitle")}</h2>
              <p className="data mt-4">{t("editorialData")}</p>
              <p className="mt-4 max-w-prose text-pizarra">{wari.description}</p>
              <Link href={`/s/${wari.slug}`} className="mt-8 inline-flex h-cta items-center rounded-md bg-granito px-6 font-semibold text-nieve">
                {t("editorialCta")}
              </Link>
            </div>
          </section>
        )}

        {/* 5. Newsletter inline */}
        <Newsletter />
      </div>
    </main>
  );
}
