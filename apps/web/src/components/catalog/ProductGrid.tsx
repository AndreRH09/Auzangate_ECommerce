import type { Card } from "@/lib/api";
import { ProductCard } from "./ProductCard";

// Grilla de catálogo: 2 col mobile / 4 desktop, gap 4 px columna / 32 px fila (design system §2.3).
// Las 4 primeras fotos cargan con prioridad (están sobre el pliegue).
export function ProductGrid({ products }: { products: Card[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-1 gap-y-8 md:grid-cols-4">
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} priority={i < 4} />
        </li>
      ))}
    </ul>
  );
}
