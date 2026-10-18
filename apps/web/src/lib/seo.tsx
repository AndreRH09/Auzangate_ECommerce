import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { SITE_URL } from "./format";

const OG_DEFAULT = "/brand/og.png";

// Metadata de una página indexable (plan §8.3): canonical a sí misma, hreflang es/en + x-default (-> es), Open Graph.
// `paths` es la ruta sin prefijo de idioma en cada idioma, porque los slugs se traducen.
export function pageMeta({
  locale,
  paths,
  title,
  description,
  image,
}: {
  locale: Locale;
  paths: Record<Locale, string>;
  title?: string;
  description: string;
  image?: string;
}): Metadata {
  const url = `/${locale}${paths[locale]}`;
  return {
    ...(title && { title }),
    description,
    alternates: {
      canonical: url,
      languages: { es: `/es${paths.es}`, en: `/en${paths.en}`, "x-default": `/es${paths.es}` },
    },
    openGraph: {
      ...(title && { title }),
      description,
      url,
      siteName: "AUZANGATE",
      locale: locale === "es" ? "es_PE" : "en_US",
      type: "website",
      images: [image ?? OG_DEFAULT],
    },
    twitter: { card: "summary_large_image" },
  };
}

export const absolute = (path: string) => new URL(path, SITE_URL).toString();

export function JsonLd({ data }: { data: object }) {
  // "<" escapado: un nombre de producto con "</script>" no puede cerrar la etiqueta
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

// Breadcrumb visible (mono 12) + BreadcrumbList JSON-LD (plan §8.4)
export function Breadcrumb({ locale, items }: { locale: Locale; items: { name: string; href: string }[] }) {
  return (
    <>
      <nav aria-label="breadcrumb" className="data text-pizarra">
        <ol className="flex flex-wrap gap-1">
          {items.map((it, i) => (
            <li key={it.href} className="flex gap-1">
              {i > 0 && <span aria-hidden>/</span>}
              {i === items.length - 1 ? (
                <span aria-current="page" className="text-granito">{it.name}</span>
              ) : (
                <Link href={it.href} className="hover:text-granito">{it.name}</Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: items.map((it, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: it.name,
            item: absolute(`/${locale}${it.href === "/" ? "" : it.href}`),
          })),
        }}
      />
    </>
  );
}
