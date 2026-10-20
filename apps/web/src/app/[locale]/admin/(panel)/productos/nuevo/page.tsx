import { NewProductForm } from "@/components/admin/NewProductForm";
import { adminApi } from "@/lib/admin";
import type { AdminCatalogOptions } from "@/lib/api";

export default async function AdminProductNew({ params }: PageProps<"/[locale]/admin/productos/nuevo">) {
  const { locale } = await params;
  return <NewProductForm options={await adminApi<AdminCatalogOptions>(`/catalog-options?locale=${locale}`)} />;
}
