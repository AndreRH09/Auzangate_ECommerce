import { Handbag, Heart, List, MagnifyingGlass, User } from "@phosphor-icons/react/dist/ssr";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { BrandMark } from "../ui/BrandMark";
import { MainMenu } from "./MainMenu";
import { SEARCH_PANEL_ID, SearchPanel } from "./SearchPanel";

const icon = "size-11 grid place-items-center"; // zona táctil 44 px

// Header tipo C (design system §3): Menú | logo al centro | búsqueda (lupa → SearchPanel), cuenta, favoritos, bolsa.
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
        </div>

        {/* manual de marca §5: lockup horizontal en desktop, monograma en mobile */}
        <Link href="/" aria-label="AUZANGATE" className="flex h-11 items-center transition-opacity duration-150 hover:opacity-80">
          <BrandMark asset="lockup-horizontal" className="hidden h-9 md:block" />
          <BrandMark asset="isotipo" className="h-10 md:hidden" />
        </Link>

        <nav aria-label={t("account")} className="flex items-center justify-end">
          <button popoverTarget={SEARCH_PANEL_ID} aria-label={t("searchLabel")} className={icon}>
            <MagnifyingGlass size={20} aria-hidden />
          </button>
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
      <SearchPanel locale={locale} />
    </header>
  );
}
