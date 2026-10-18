import type { Metadata } from "next";
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
