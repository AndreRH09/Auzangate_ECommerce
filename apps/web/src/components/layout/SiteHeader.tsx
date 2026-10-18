import { Handbag, Heart, List, MagnifyingGlass, User } from "@phosphor-icons/react/dist/ssr";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { MainMenu } from "./MainMenu";

const icon = "size-11 grid place-items-center"; // zona táctil 44 px

// Header tipo C (design system §3): Menú + búsqueda | logo al centro | cuenta, favoritos, bolsa.
export async function SiteHeader({ locale }: { locale: Locale }) {
  const t = await getTranslations("Header");

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

      <MainMenu locale={locale} />
    </header>
  );
}
