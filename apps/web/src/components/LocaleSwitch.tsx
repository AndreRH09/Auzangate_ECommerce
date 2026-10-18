"use client";

import { useLocale } from "next-intl";

// Cambia de idioma conservando la página: usa el <link rel="alternate" hreflang> que cada página ya
// declara en su metadata (los slugs se traducen: /es/p/casaca-kuntur <-> /en/p/kuntur-jacket).
// Sin hreflang (búsqueda, 404) cae a la home del otro idioma.
export function LocaleSwitch({ label }: { label: string }) {
  const other = useLocale() === "es" ? "en" : "es";
  return (
    <a
      href={`/${other}`}
      hrefLang={other}
      className="data flex h-11 items-center px-2 uppercase underline-offset-4 hover:underline"
      onClick={(e) => {
        const alt = document.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${other}"]`);
        if (alt) e.currentTarget.href = alt.href;
      }}
    >
      {label}
    </a>
  );
}
