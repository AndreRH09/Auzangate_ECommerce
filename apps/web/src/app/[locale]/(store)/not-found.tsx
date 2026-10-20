import { getTranslations } from "next-intl/server";
import { BrandMark } from "@/components/ui/BrandMark";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("NotFound");
  return (
    <main className="mx-auto flex max-w-[1600px] flex-col items-center px-4 py-32 text-center md:px-8">
      <BrandMark asset="isotipo" className="h-20 text-linea" />
      <p className="data mt-6 tracking-[0.2em] text-pizarra">404 · 6384 · PERÚ</p>
      <h1 className="section-title mt-4">{t("title")}</h1>
      <Link href="/" className="btn mt-8 bg-granito text-nieve hover:bg-pizarra">{t("cta")}</Link>
    </main>
  );
}
