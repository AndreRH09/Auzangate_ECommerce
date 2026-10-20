import type { Image } from "@/lib/api";
import { ProductPhoto } from "../ui/ProductPhoto";

// Galería horizontal con scroll-snap (design system §5): fotos de 42vw en desktop, 100vw en mobile
// con contador "1 / 3". La 1ª foto carga con prioridad (LCP de la ficha).
export function ProductGallery({ images, label }: { images: Image[]; label: string }) {
  return (
    <ul className="flex snap-x snap-mandatory gap-2 overflow-x-auto" aria-label={label}>
      {images.map((img, i) => (
        <li key={img.url} className="relative shrink-0 basis-full snap-start md:basis-[42vw]">
          <ProductPhoto image={img} pad="p-8" priority={i === 0} className="aspect-[4/5] w-full bg-photo" />
          <span className="data absolute bottom-3 left-3 rounded-sm bg-granito/80 px-2 py-1 text-nieve md:hidden">
            {i + 1} / {images.length}
          </span>
        </li>
      ))}
    </ul>
  );
}
