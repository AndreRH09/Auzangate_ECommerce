"use client";

import { useLocale } from "next-intl";
import { routing } from "@/i18n/routing";

// Selector ES | EN. Conserva la página: usa el <link rel="alternate" hreflang> que cada página declara
// en su metadata (los slugs se traducen: /es/p/casaca-kuntur <-> /en/p/kuntur-jacket).
// Sin hreflang (búsqueda, 404) cae a la home del otro idioma.
export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const current = useLocale();
  return (
    <ul className={`data flex items-center ${className}`} aria-label="Idioma / Language">
      {routing.locales.map((l, i) => (
        <li key={l} className="flex items-center">
          {i > 0 && <span aria-hidden className="px-1 opacity-40">|</span>}
          {l === current ? (
            <span aria-current="true" className="flex h-8 items-center px-1 uppercase underline decoration-1 underline-offset-4">
              {l}
            </span>
          ) : (
            <a
              href={`/${l}`}
              hrefLang={l}
              lang={l}
              className="flex h-8 items-center px-1 uppercase opacity-70 transition-opacity duration-150 hover:opacity-100"
              onClick={(e) => {
                const alt = document.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${l}"]`);
                if (alt) e.currentTarget.href = alt.href;
              }}
            >
              {l}
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}
