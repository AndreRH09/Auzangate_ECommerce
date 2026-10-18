import { Link } from "@/i18n/navigation";
import type { Image } from "@/lib/api";
import { ProductPhoto } from "../ui/ProductPhoto";

export type CategoryTile = { name: string; href: string; image?: Image };

// Franja de 4 tiles: foto + nombre debajo, sin texto encima de la foto (design system §7.2)
export function CategoryStrip({ title, tiles }: { title: string; tiles: CategoryTile[] }) {
  return (
    <section className="mt-16" aria-labelledby="h-cat">
      <h2 id="h-cat" className="sr-only">{title}</h2>
      <ul className="grid grid-cols-2 gap-1 md:grid-cols-4">
        {tiles.map((tile) => (
          <li key={tile.href}>
            <Link href={tile.href} className="group block">
              <div className="aspect-[4/5] overflow-hidden rounded-sm bg-photo">
                {tile.image && <ProductPhoto image={tile.image} alt="" className="size-full" />}
              </div>
              <p className="mt-3 text-sm font-semibold group-hover:underline">{tile.name}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
