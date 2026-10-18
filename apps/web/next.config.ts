import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// ponytail: sin cacheComponents/partialPrefetching (defaults del CLI). El plan usa ISR con
// revalidate + revalidateTag; se evalúa el modelo nuevo cuando OpenNext lo soporte estable.
const nextConfig: NextConfig = {
  // Sin middleware (OpenNext no soporta el runtime Node en middleware): "/" redirige con una regla estática
  async redirects() {
    return [{ source: "/", destination: "/es", permanent: true }]; // permanent = 308
  },
  // Preview de PRs: noindex también en la cabecera, para todo (HTML, sitemap, imágenes). Plan §8.2
  async headers() {
    return process.env.SITE_ENV === "preview"
      ? [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex" }] }]
      : [];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

// El plugin conecta src/i18n/request.ts con next-intl
export default createNextIntlPlugin()(nextConfig);
