import { Plus, X } from "@phosphor-icons/react/dist/ssr";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getCategories, getSeries } from "@/lib/api";
import { PopoverPanel } from "../ui/PopoverPanel";
import { LanguageSwitcher } from "./LanguageSwitcher";

// Menú que abre el botón "Menú" del header (popover id="menu").
// Desktop: mega menú de 4 columnas. Mobile: acordeón con filas de 56 px (design system §3).
export async function MainMenu({ locale }: { locale: Locale }) {
  const [t, categories, series] = await Promise.all([getTranslations("Header"), getCategories(locale), getSeries(locale)]);

  const groups = [
    ...categories.map((c) => ({
      key: c.slug,
      name: c.name,
      href: `/c/${c.slug}` as string | null,
      items: c.children.map((ch) => ({ name: ch.name, href: `/c/${ch.slug}` })),
    })),
    { key: "series", name: t("series"), href: null, items: series.map((s) => ({ name: s.name, href: `/s/${s.slug}` })) },
  ];

  return (
    <PopoverPanel
      id="menu"
      className="m-0 h-dvh max-h-none w-full max-w-none overflow-y-auto border-0 bg-glaciar p-0 text-granito [--from:0_-16px] md:h-auto md:border-b md:border-linea"
    >
      <div className="flex h-14 items-center justify-between border-b border-linea px-2 md:h-header md:px-6">
        <button popoverTarget="menu" popoverTargetAction="hide" className="flex h-11 items-center gap-2 px-2 font-semibold">
          <X size={20} aria-hidden />
          {t("close")}
        </button>
        <LanguageSwitcher className="pr-2" />
      </div>

      {/* desktop: mega menú */}
      <div className="mx-auto hidden max-w-[1600px] grid-cols-4 gap-8 px-8 py-10 md:grid">
        {groups.map((g) => (
          <div key={g.key}>
            {g.href ? (
              <Link href={g.href} className="font-semibold hover:underline">{g.name}</Link>
            ) : (
              <p className="font-semibold">{g.name}</p>
            )}
            <ul className="mt-4 space-y-3">
              {g.items.map((it) => (
                <li key={it.href}>
                  <Link href={it.href} className="text-pizarra hover:text-granito">{it.name}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* mobile: acordeón exclusivo nativo */}
      <ul className="md:hidden">
        {groups.map((g) => (
          <li key={g.key} className="border-b border-linea">
            <details name="menu-mobile" className="group">
              <summary className="flex h-14 cursor-pointer list-none items-center justify-between px-4 text-base font-semibold">
                {g.name}
                <Plus size={18} aria-hidden className="transition-transform group-open:rotate-45 motion-reduce:transition-none" />
              </summary>
              <ul className="pb-2">
                {g.href && (
                  <li>
                    <Link href={g.href} className="flex h-12 items-center px-6">{t("seeAll")}</Link>
                  </li>
                )}
                {g.items.map((it) => (
                  <li key={it.href}>
                    <Link href={it.href} className="flex h-12 items-center px-6 text-pizarra">{it.name}</Link>
                  </li>
                ))}
              </ul>
            </details>
          </li>
        ))}
      </ul>
    </PopoverPanel>
  );
}
