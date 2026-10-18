import type { Metadata } from "next";
import { Archivo, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/format";
import "../globals.css";

// next/font descarga las fuentes en el build y las sirve desde el propio dominio (sin llamadas a Google en runtime)
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"], // eje de ancho 62-125: texto normal y extendido con una sola familia
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Pre-genera /es y /en en el build (estático)
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t("title"), template: "%s · AUZANGATE" },
    description: t("description"),
    // preview (PRs): nunca indexar (plan §8.2)
    ...(process.env.SITE_ENV === "preview" && { robots: { index: false, follow: false } }),
  };
}

// Este es el layout raíz: no hay app/layout.tsx porque <html lang> depende del idioma.
export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale); // sustituye al middleware: le dice a next-intl el idioma de esta request

  return (
    <html lang={locale} className={`${archivo.variable} ${geistMono.variable} antialiased`}>
      <body className="flex min-h-dvh flex-col">
        <NextIntlClientProvider>
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-nieve focus:p-3">
            {locale === "es" ? "Saltar al contenido" : "Skip to content"}
          </a>
          <Header locale={locale} />
          <div id="main" className="flex-1">{children}</div>
          <Footer locale={locale} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
