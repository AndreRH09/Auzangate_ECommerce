import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getCategories, getSeries } from "@/lib/api";
import { NewsletterForm } from "./NewsletterForm";
import { BrandMark } from "../ui/BrandMark";
import { LanguageSwitcher } from "./LanguageSwitcher";

// Footer en plomo, blanco sobre plomo (manual de marca §2): newsletter, links y el lockup real
// (isotipo + wordmark) a todo el ancho como único gesto de personalidad (design system §1.3).
export async function SiteFooter({ locale }: { locale: Locale }) {
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
    <footer className="mt-32 overflow-hidden bg-granito text-nieve">
      <div className="mx-auto max-w-[1600px] px-4 md:px-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 border-b border-nieve/15 py-16 md:grid-cols-[1.4fr_1fr_1fr_auto]">
          <div className="col-span-2 md:col-span-1">
            <NewsletterForm />
          </div>
          {cols.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <p className="data tracking-[0.2em] uppercase opacity-60">{col.title}</p>
              <ul className="mt-4">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="flex min-h-11 items-center opacity-85 transition-opacity duration-150 hover:opacity-100 md:min-h-9">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
          {/* el isotipo solo, arriba a la derecha: la pieza más representativa de la marca */}
          <BrandMark asset="isotipo" label="AUZANGATE" className="h-16 self-start max-md:hidden md:h-20" />
        </div>

        {/* cierre: lockup horizontal a escala de firma + créditos e idioma */}
        <div className="flex flex-wrap items-end justify-between gap-6 py-8">
          <BrandMark asset="lockup-horizontal" label="AUZANGATE" className="block w-30 md:w-50" />
          <div className="data flex flex-wrap items-center gap-6 opacity-80">
            <p>© {new Date().getFullYear()} AUZANGATE · {t("rights")}</p>
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </footer>
  );
}
