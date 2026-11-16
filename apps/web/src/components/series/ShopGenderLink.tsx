"use client";

import type { ReactNode } from "react";
import { Link, useRouter } from "@/i18n/navigation";

// «Comprar hombre / mujer» de las páginas de serie: aplica el filtro de género al listado y baja hasta #productos.
// Con JS: router.replace sin scroll + scroll suave al listado (el salto por #hash no siempre ocurre en una navegación
// dentro de la misma página). Sin JS: el href normal hace lo mismo con recarga.
export function ShopGenderLink({ slug, gender, className, children }: { slug: string; gender: "men" | "women"; className: string; children: ReactNode }) {
  const router = useRouter();
  const href = `/s/${slug}?gender=${gender}`;
  return (
    <Link
      href={`${href}#productos`}
      className={className}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; // abrir en otra pestaña sigue funcionando
        e.preventDefault();
        router.replace(href, { scroll: false });
        document.getElementById("productos")?.scrollIntoView({ behavior: "smooth" });
      }}
    >
      {children}
    </Link>
  );
}
