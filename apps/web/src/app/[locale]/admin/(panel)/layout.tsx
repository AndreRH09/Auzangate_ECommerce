import { ChartBar, FolderSimple, Gear, Package, ShoppingCart, SignOut } from "@phosphor-icons/react/dist/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { logout } from "@/app/actions";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { BrandMark } from "@/components/ui/BrandMark";
import { Link } from "@/i18n/navigation";
import { getAdmin } from "@/lib/admin";

// Todo lo que cuelga de (panel) exige sesión de admin. La API vuelve a validar cada request:
// esta redirección es para la UX, la seguridad está en el AdminGuard.
export default async function AdminPanelLayout({ children, params }: LayoutProps<"/[locale]/admin">) {
  const { locale } = await params;
  const admin = await getAdmin();
  if (!admin) redirect(`/${locale}/admin/login`);
  const [t, jar] = await Promise.all([getTranslations("Admin"), cookies()]);

  const icon = { size: 18 };
  const items = [
    { href: "/admin", label: t("dashboard"), icon: <ChartBar {...icon} /> },
    { href: "/admin/productos", label: t("products"), icon: <Package {...icon} /> },
    { href: "/admin/categorias", label: t("catalogSetup"), icon: <FolderSimple {...icon} /> },
    { href: "/admin/pedidos", label: t("orders"), icon: <ShoppingCart {...icon} />, phase: "F2" },
    { href: "/admin/ajustes", label: t("settings"), icon: <Gear {...icon} />, phase: "F2" },
  ];

  return (
    <div className="flex flex-1 max-md:flex-col">
      <AdminSidebar
        items={items}
        initialCollapsed={jar.get("admin_sidebar")?.value === "collapsed"}
        labels={{ menu: t("menu"), close: t("close"), collapse: t("collapse"), expand: t("expand") }}
        brand={
          <Link href="/admin" className="flex items-center gap-3">
            <BrandMark asset="isotipo" className="h-7" />
            <span className="data tracking-[0.2em]">ADMIN</span>
          </Link>
        }
        footer={
          <form action={logout} className="space-y-2 text-sm">
            <p className="truncate group-data-[collapsed=true]:sr-only" title={admin.email}>
              {admin.name}
              <span className="data block truncate text-xs text-pizarra">{admin.email}</span>
            </p>
            <button className="flex h-9 w-full items-center gap-2 rounded-md px-2 text-pizarra hover:bg-roca-clara hover:text-granito group-data-[collapsed=true]:justify-center" title={t("logout")}>
              <SignOut size={16} aria-hidden />
              <span className="group-data-[collapsed=true]:sr-only">{t("logout")}</span>
            </button>
          </form>
        }
      />
      <main className="mx-auto w-full max-w-[1600px] min-w-0 flex-1 px-4 py-10 md:px-8">{children}</main>
    </div>
  );
}
