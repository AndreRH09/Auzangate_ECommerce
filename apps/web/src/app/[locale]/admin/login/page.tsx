import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { BrandMark } from "@/components/ui/BrandMark";
import { getAdmin } from "@/lib/admin";

export default async function AdminLoginPage({ params }: PageProps<"/[locale]/admin/login">) {
  const { locale } = await params;
  if (await getAdmin()) redirect(`/${locale}/admin`);
  const t = await getTranslations("Admin");

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-panel bg-nieve p-8">
        <BrandMark asset="isotipo" className="h-10" />
        <h1 className="mt-6 text-2xl font-semibold">{t("loginTitle")}</h1>
        <AdminLoginForm />
      </div>
    </main>
  );
}
