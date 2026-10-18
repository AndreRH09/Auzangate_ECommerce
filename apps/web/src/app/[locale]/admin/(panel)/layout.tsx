import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { logout } from "@/app/actions";
import { BrandMark } from "@/components/ui/BrandMark";
import { Link } from "@/i18n/navigation";
import { getAdmin } from "@/lib/admin";

// Todo lo que cuelga de (panel) exige sesión de admin. La API vuelve a validar cada request:
// esta redirección es para la UX, la seguridad está en el AdminGuard.
export default async function AdminPanelLayout({ children, params }: LayoutProps<"/[locale]/admin">) {
  const { locale } = await params;
  const admin = await getAdmin();
  if (!admin) redirect(`/${locale}/admin/login`);
  const t = await getTranslations("Admin");

  return (
    <>
      <header className="flex items-center justify-between gap-4 border-b border-linea bg-nieve px-4 py-3 md:px-8">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="flex items-center gap-3">
            <BrandMark asset="isotipo" className="h-7" />
            <span className="data tracking-[0.2em]">ADMIN</span>
          </Link>
          <nav className="text-sm">
            <Link href="/admin/productos" className="hover:underline hover:underline-offset-4">{t("products")}</Link>
          </nav>
        </div>
        <form action={logout} className="flex items-center gap-4 text-sm">
          <span className="max-sm:sr-only">{admin.name} · {admin.email}</span>
          <button className="underline underline-offset-4 hover:text-pizarra">{t("logout")}</button>
        </form>
      </header>
      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-10 md:px-8">{children}</main>
    </>
  );
}
