import type { MetadataRoute } from "next";
import { absolute } from "@/lib/seo";

// Plan §8.2: en preview (PRs) no se indexa nada; en producción solo se bloquean las páginas privadas.
export default function robots(): MetadataRoute.Robots {
  if (process.env.SITE_ENV === "preview") return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/*/bolsa", "/*/checkout", "/*/cuenta", "/admin", "/api/"] },
    sitemap: absolute("/sitemap.xml"),
  };
}
