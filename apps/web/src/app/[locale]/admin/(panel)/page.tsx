import { getTranslations } from "next-intl/server";

// ponytail: placeholder hasta el admin de catálogo (F1·4)
export default async function AdminHome() {
  const t = await getTranslations("Admin");
  return (
    <>
      <h1 className="section-title">{t("title")}</h1>
      <p className="mt-4 text-pizarra">{t("soon")}</p>
    </>
  );
}
