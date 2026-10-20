import { ProductForm } from "@/components/admin/ProductForm";
import type { Locale } from "@/i18n/routing";
import { adminApi } from "@/lib/admin";
import type { AdminCatalogOptions, AdminProduct } from "@/lib/api";

export default async function AdminProductEdit({ params }: PageProps<"/[locale]/admin/productos/[id]">) {
  const { locale, id } = await params;
  const [product, options] = await Promise.all([
    adminApi<AdminProduct>(`/products/${encodeURIComponent(id)}`),
    adminApi<AdminCatalogOptions>(`/catalog-options?locale=${locale}`),
  ]);
  return <ProductForm product={product} options={options} locale={locale as Locale} />;
}
