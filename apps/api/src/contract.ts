// Contrato de respuestas de la API: lo que viaja en el JSON.
// Los services declaran devolver estos tipos (si la respuesta cambia y el contrato no, la API no compila)
// y la web los importa con `import type` desde @api/contract, así los dos lados no pueden divergir.
// Reglas: sin imports (lo compila también el tsconfig de la web) y solo tipos JSON (fechas como string ISO).
// ponytail: tipos TS compartidos en vez de OpenAPI + generador; generar openapi.json cuando haya un
// consumidor que no sea TypeScript (app móvil, terceros).

export type Locale = 'es' | 'en';
export type Alternates = Record<Locale, string>;

export type Image = { url: string; alt: string; width: number; height: number; colorHex: string | null }; // null = todos los colores
export type Color = { hex: string; name: string };
export type Named = { name: string; slug: string; alternates: Alternates };

export type Card = {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  priceCents: number;
  colors: Color[];
  isNew: boolean;
  soldOut: boolean;
  images: Image[];
  alternates: Alternates;
};

export type Category = Named & { children: Named[] };
export type Series = Named & { code: string; description: string };

export type ProductList = {
  total: number;
  items: Card[];
  nextCursor: string | null;
  facets: { sizes: string[]; colors: Color[]; price: { min: number; max: number } };
};

export type Variant = { id: string; sku: string; colorHex: string; colorName: string; size: string; priceCents: number; stock: number };

export type Product = {
  id: string;
  code: string;
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  techSpecs: Record<string, string>;
  updatedAt: string;
  alternates: Alternates;
  category: Named & { parent: Named | null };
  series: (Named & { code: string }) | null;
  variants: Variant[];
  images: Image[];
  related: Card[];
};

export type SitemapFeed = {
  products: { updatedAt: string; slugs: Alternates; images: string[] }[];
  categories: { slugs: Alternates }[];
  series: { slugs: Alternates }[];
};

export type Admin = { id: string; email: string; name: string };
export type LoginResponse = { accessToken: string; expiresIn: number };
