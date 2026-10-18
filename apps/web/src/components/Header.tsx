import { Handbag, Heart, List, MagnifyingGlass, Plus, User, X } from "@phosphor-icons/react/dist/ssr";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getCategories, getSeries } from "@/lib/api";
import { LocaleSwitch } from "./LocaleSwitch";
import { Popover } from "./Popover";

const icon = "size-11 grid place-items-center"; // zona táctil 44 px

// Header tipo C (design system §3): Menú + búsqueda | logo al centro | cuenta, favoritos, bolsa.
export async function Header({ locale }: { locale: Locale }) {
  const [t, categories, series] = await Promise.all([getTranslations("Header"), getCategories(locale), getSeries(locale)]);

  return (
    <header className="sticky top-0 z-40 border-b border-linea bg-glaciar/90 backdrop-blur-md">
      <div className="mx-auto grid h-14 max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-2 md:h-header md:px-6">
        <div className="flex items-center gap-2">
          <button popoverTarget="menu" className="flex h-11 items-center gap-2 px-2 font-semibold">
            <List size={20} aria-hidden />
            <span className="max-md:sr-only">{t("menu")}</span>
          </button>
          <form action={`/${locale}/buscar`} role="search" className="relative hidden md:block">
            <MagnifyingGlass size={16} aria-hidden className="absolute top-1/2 left-3 -translate-y-1/2 text-pizarra" />
            <label htmlFor="header-q" className="sr-only">{t("searchLabel")}</label>
            <input
              id="header-q"
              name="q"
              type="search"
              placeholder={t("search")}
              className="h-10 w-64 rounded-sm border border-linea bg-nieve pr-3 pl-9 placeholder:text-pizarra lg:w-80"
            />
          </form>
        </div>

        <Link href="/" aria-label="AUZANGATE" className="flex h-11 items-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG de marca */}
          <img src="/brand/wordmark.svg" alt="" width={180} height={22} className="hidden h-[22px] w-auto md:block" />
          <span className="display text-xl md:hidden">Auzan</span>
        </Link>

        <nav aria-label={t("account")} className="flex items-center justify-end">
          <Link href="/buscar" aria-label={t("searchLabel")} className={`${icon} md:hidden`}>
            <MagnifyingGlass size={20} aria-hidden />
          </Link>
          {/* ponytail: cuenta, favoritos y bolsa enlazan a rutas de F2; el contador queda en 0 hasta tener bolsa */}
          <span className={`${icon} max-md:hidden`}>
            <User size={20} aria-hidden />
            <span className="sr-only">{t("account")}</span>
          </span>
          <span className={`${icon} max-md:hidden`}>
            <Heart size={20} aria-hidden />
            <span className="sr-only">{t("favorites")}</span>
          </span>
          <span className={`${icon} relative`}>
            <Handbag size={20} aria-hidden />
            <span className="sr-only">{t("bag")}</span>
            <span className="data absolute right-1 bottom-1 leading-none">0</span>
          </span>
        </nav>
      </div>

      <Popover
        id="menu"
        className="m-0 h-dvh max-h-none w-full max-w-none overflow-y-auto border-0 bg-glaciar p-0 text-granito md:h-auto md:border-b md:border-linea"
      >
        <div className="flex h-14 items-center justify-between border-b border-linea px-2 md:h-header md:px-6">
          <button popoverTarget="menu" popoverTargetAction="hide" className="flex h-11 items-center gap-2 px-2 font-semibold">
            <X size={20} aria-hidden />
            {t("close")}
          </button>
          <LocaleSwitch label={t("otherLocale")} />
        </div>

        {/* desktop: mega menú de 4 columnas */}
        <div className="mx-auto hidden max-w-[1600px] grid-cols-4 gap-8 px-8 py-10 md:grid">
          {categories.map((c) => (
            <div key={c.slug}>
              <Link href={`/c/${c.slug}`} className="font-semibold hover:underline">
                {c.name}
              </Link>
              <ul className="mt-4 space-y-3">
                {c.children.map((ch) => (
                  <li key={ch.slug}>
                    <Link href={`/c/${ch.slug}`} className="text-pizarra hover:text-granito">
                      {ch.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <p className="font-semibold">{t("series")}</p>
            <ul className="mt-4 space-y-3">
              {series.map((s) => (
                <li key={s.slug}>
                  <Link href={`/s/${s.slug}`} className="text-pizarra hover:text-granito">
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* mobile: acordeón con filas de 56 px */}
        <ul className="md:hidden">
          {[...categories.map((c) => ({ key: c.slug, name: c.name, href: `/c/${c.slug}`, items: c.children.map((ch) => ({ name: ch.name, href: `/c/${ch.slug}` })) })),
            { key: "series", name: t("series"), href: null, items: series.map((s) => ({ name: s.name, href: `/s/${s.slug}` })) }].map((g) => (
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
      </Popover>
    </header>
  );
}
