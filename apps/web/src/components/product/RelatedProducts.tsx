import { getTranslations } from "next-intl/server";
import type { Card } from "@/lib/api";
import { ProductGrid } from "../catalog/ProductGrid";

// "Combina con": misma serie o categoría (lo resuelve la API)
export async function RelatedProducts({ products }: { products: Card[] }) {
  if (!products.length) return null;
  const t = await getTranslations("Product");
  return (
    <section className="mt-24" aria-labelledby="h-rel">
      <h2 id="h-rel" className="section-title mb-8">{t("related")}</h2>
      <ProductGrid products={products} />
    </section>
  );
}
