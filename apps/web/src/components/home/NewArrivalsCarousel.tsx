import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Card } from "@/lib/api";
import { ProductCard } from "../catalog/ProductCard";

// "Recién llegado": carrusel manual con scroll-snap nativo, sin autoplay (design system §7.3)
export async function NewArrivalsCarousel({ products }: { products: Card[] }) {
  const t = await getTranslations("Home");
  return (
    <section className="mt-24" aria-labelledby="h-new">
      <div className="flex items-end justify-between">
        <h2 id="h-new" className="section-title">{t("newArrivals")}</h2>
        <Link href="/buscar?sort=new" className="data uppercase underline-offset-4 hover:underline">{t("seeAll")}</Link>
      </div>
      <ul className="mt-8 flex snap-x snap-mandatory gap-1 overflow-x-auto pb-4">
        {products.map((p) => (
          <li key={p.id} className="w-[46vw] shrink-0 snap-start md:w-[calc((100%-12px)/4)]">
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}
