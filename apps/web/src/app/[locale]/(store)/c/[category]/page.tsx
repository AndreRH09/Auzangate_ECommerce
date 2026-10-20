import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProductListing, type ListingParams } from "@/components/catalog/ProductListing";
import type { Locale } from "@/i18n/routing";
import { getCategories } from "@/lib/api";
import { Breadcrumb } from "@/components/seo/Breadcrumb";
import { pageMeta } from "@/lib/seo";

// Busca la categoría (padre o hija) y su padre para el breadcrumb
async function find(locale: Locale, slug: string) {
  for (const parent of await getCategories(locale)) {
    if (parent.slug === slug) return { category: parent, parent: null };
    const child = parent.children.find((c) => c.slug === slug);
    if (child) return { category: child, parent };
  }
  notFound();
}

export async function generateMetadata({ params }: PageProps<"/[locale]/c/[category]">) {
  const { locale, category } = await params;
  const { category: c, parent } = await find(locale as Locale, category);
  const t = await getTranslations({ locale, namespace: "Metadata" });
  const title = parent ? `${parent.name} · ${c.name}` : c.name;
  return pageMeta({
    locale: locale as Locale,
    paths: { es: `/c/${c.alternates.es}`, en: `/c/${c.alternates.en}` },
    title,
    description: `${title}. ${t("description")}`.slice(0, 160),
  });
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/[locale]/c/[category]">) {
  const { locale: raw, category } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);
  const [{ category: c, parent }, th] = await Promise.all([find(locale, category), getTranslations("Header")]);

  return (
    <ProductListing
      locale={locale}
      path={`/c/${c.slug}`}
      base={{ category: c.slug }}
      params={(await searchParams) as ListingParams}
      title={c.name}
      breadcrumb={
        <Breadcrumb
          locale={locale}
          items={[
            { name: th("home"), href: "/" },
            ...(parent ? [{ name: parent.name, href: `/c/${parent.slug}` }] : []),
            { name: c.name, href: `/c/${c.slug}` },
          ]}
        />
      }
    />
  );
}
