import type { MetadataRoute } from "next";
import { getSitemapFeed } from "@/lib/api";
import { absolute } from "@/lib/seo";

export const revalidate = 3600; // + revalidateTag("sitemap") cuando el admin publica

type Slugs = { es: string; en: string };

// Una entrada por URL y por idioma, cada una con sus alternates (hreflang recíproco, plan §8.1)
function entries(path: (slug: string) => string, slugs: Slugs, extra: Partial<MetadataRoute.Sitemap[number]> = {}) {
  const languages = { es: absolute(`/es${path(slugs.es)}`), en: absolute(`/en${path(slugs.en)}`), "x-default": absolute(`/es${path(slugs.es)}`) };
  return (["es", "en"] as const).map((l) => ({ url: languages[l], alternates: { languages }, ...extra }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const feed = await getSitemapFeed();
  return [
    ...entries(() => "", { es: "", en: "" }),
    ...feed.categories.flatMap((c) => entries((s) => `/c/${s}`, c.slugs)),
    ...feed.series.flatMap((s) => entries((x) => `/s/${x}`, s.slugs)),
    ...feed.products.flatMap((p) =>
      entries((s) => `/p/${s}`, p.slugs, { lastModified: p.updatedAt, images: p.images.map((i) => absolute(i)) }),
    ),
  ];
}
