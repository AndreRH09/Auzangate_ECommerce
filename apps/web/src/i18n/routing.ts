import { defineRouting } from "next-intl/routing";

// Prefijo siempre (/es, /en). Sin detección por Accept-Language: Google recomienda no forzar redirecciones por idioma.
export const routing = defineRouting({
  locales: ["es", "en"],
  defaultLocale: "es",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];
