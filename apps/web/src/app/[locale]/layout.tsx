import type { Metadata } from "next";
import { Archivo, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
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
  return { title: "AUZANGATE", description: t("description") };
}

// Este es el layout raíz: no hay app/layout.tsx porque <html lang> depende del idioma.
export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale); // sustituye al middleware: le dice a next-intl el idioma de esta request

  return (
    <html lang={locale} className={`${archivo.variable} ${geistMono.variable} antialiased`}>
      <body className="min-h-dvh">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
