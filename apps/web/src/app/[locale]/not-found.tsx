import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("NotFound");
  return (
    <main className="mx-auto max-w-[1600px] px-4 py-32 text-center md:px-8">
      <p className="data text-pizarra">404</p>
      <h1 className="section-title mt-4">{t("title")}</h1>
      <Link href="/" className="mt-8 inline-flex h-cta items-center rounded-md bg-granito px-6 font-semibold text-nieve">
        {t("cta")}
      </Link>
    </main>
  );
}
