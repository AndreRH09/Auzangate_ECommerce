import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getCategories, getSeries } from "@/lib/api";
import { LocaleSwitch } from "./LocaleSwitch";

export async function Footer({ locale }: { locale: Locale }) {
  const [t, th, categories, series] = await Promise.all([
    getTranslations("Footer"),
    getTranslations("Header"),
    getCategories(locale),
    getSeries(locale),
  ]);

  const cols = [
    { title: t("shop"), links: categories.map((c) => ({ label: c.name, href: `/c/${c.slug}` })) },
    { title: th("series"), links: series.map((s) => ({ label: s.name, href: `/s/${s.slug}` })) },
  ];

  return (
    <footer className="mt-32 overflow-hidden border-t border-linea">
      <div className="mx-auto grid max-w-[1600px] grid-cols-2 gap-8 px-4 py-12 md:grid-cols-4 md:px-8">
        {cols.map((col) => (
          <div key={col.title}>
            <p className="font-semibold">{col.title}</p>
            <ul className="mt-4 space-y-1">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="flex min-h-11 items-center text-pizarra hover:text-granito md:min-h-8">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="col-span-2 flex flex-col items-start justify-between gap-4 md:items-end">
          <LocaleSwitch label={th("otherLocale")} />
          <p className="data text-pizarra">© {new Date().getFullYear()} AUZANGATE · {t("rights")}</p>
        </div>
      </div>
      {/* Único gesto de personalidad (design system §1.3): wordmark a todo el ancho, recortado por el borde inferior.
          Archivo 125 % mide ~9.4em para 9 letras -> 10.4vw llena el ancho. */}
      <p aria-hidden className="display -mb-[0.18em] h-[0.66em] text-center text-[10.4vw] select-none">
        Auzangate
      </p>
    </footer>
  );
}
