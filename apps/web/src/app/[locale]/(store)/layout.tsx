import { setRequestLocale } from "next-intl/server";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { TopBar } from "@/components/layout/TopBar";
import type { Locale } from "@/i18n/routing";

// Tienda: barra superior, header y footer. El grupo (store) no aparece en la URL.
export default async function StoreLayout({ children, params }: LayoutProps<"/[locale]">) {
  const locale = (await params).locale as Locale; // validado en el layout raíz
  setRequestLocale(locale);

  return (
    <>
      <TopBar />
      <SiteHeader locale={locale} />
      <div id="main" className="flex-1">{children}</div>
      <SiteFooter locale={locale} />
    </>
  );
}
