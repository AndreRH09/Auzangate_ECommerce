import type { ComponentProps } from "react";
import type { Image } from "@/lib/api";

// Foto de producto sobre el gradiente bg-photo del marco contenedor.
// object-contain siempre: una foto 4:5 llena el marco igual que con cover, y un PNG de otra proporción
// queda entero y centrado (nunca se recorta el producto). Las horizontales reciben aire extra (`pad`).
/* eslint-disable @next/next/no-img-element -- ponytail: <img> nativo con lazy loading; next/image necesita
   el binding de Cloudflare Images en el worker. Activarlo cuando las fotos reales vivan en R2. */
export function ProductPhoto({
  image,
  pad = "p-4",
  priority = false,
  className = "",
  ...props
}: { image: Image; pad?: string; priority?: boolean } & Omit<ComponentProps<"img">, "src" | "width" | "height">) {
  return (
    <img
      src={image.url}
      alt={image.alt}
      width={image.width}
      height={image.height}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      className={`object-contain ${image.width / image.height > 0.85 ? pad : ""} ${className}`}
      {...props}
    />
  );
}
