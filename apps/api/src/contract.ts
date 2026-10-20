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

export type Gender = 'UNISEX' | 'MEN' | 'WOMEN';

export type Product = {
  id: string;
  code: string;
  gender: Gender;
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

// --- Admin de catálogo ---
export type ProductStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type AdminProductRow = {
  id: string;
  code: string;
  name: string; // en el idioma pedido; el código si aún no tiene traducción
  status: ProductStatus;
  gender: Gender;
  category: string;
  series: string | null; // código: CARAL, WARI…
  variants: number;
  stock: number; // suma de todas las variantes
  priceFromCents: number | null; // null = sin variantes
  imageUrl: string | null;
  updatedAt: string;
};

export type AdminProductList = { total: number; page: number; pageSize: number; items: AdminProductRow[] };

// El slug no se edita: la API lo genera siempre del nombre (slugify) y lo devuelve en AdminProduct.
export type ProductTranslationInput = {
  name: string;
  subtitle: string;
  description: string;
  techSpecs: Record<string, string>;
};

// Cuerpo del PUT del formulario.
export type AdminProductInput = {
  code: string;
  status: ProductStatus;
  gender: Gender;
  categoryId: string;
  seriesId: string | null;
  translations: Record<Locale, ProductTranslationInput>;
  priceCents?: number; // precio de todas las variantes; omitido = no se toca
  images?: AdminImageEdit[]; // omitido = no se tocan las fotos
  colors?: AdminColorEdit[]; // renombra/recolorea las variantes de cada color
};

// Color de las variantes en el admin: `from` = hex actual (identifica el grupo de variantes).
export type AdminColor = { hex: string; nameEs: string; nameEn: string };
export type AdminColorEdit = AdminColor & { from: string };

// Borra un color: sus variantes (por hex guardado) y sus fotos (por id, incluye las aún sin color guardado).
export type AdminColorDelete = { hex: string | null; imageIds: string[] };

// Foto en el admin: r2Key es la clave en el bucket (o una ruta/URL de las fotos del seed).
export type AdminImage = { id: string; url: string; colorHex: string | null; altEs: string; altEn: string; width: number; height: number };

// Lo editable de cada foto desde el formulario; el orden del arreglo es el orden de la galería.
export type AdminImageEdit = { id: string; colorHex: string | null; altEs: string; altEn: string };

export type AdminProduct = Omit<AdminProductInput, 'translations' | 'priceCents' | 'images' | 'colors'> & {
  id: string;
  translations: Record<Locale, ProductTranslationInput & { slug: string }>;
  priceCents: number | null; // precio más bajo de las variantes; null = sin variantes
  variants: number;
  images: AdminImage[];
  colors: (AdminColor & { variants: number })[]; // colores de las variantes (uno por hex), para agrupar fotos
  updatedAt: string;
};

export type AdminImageUpload = { r2Key: string; width: number; height: number };

export type AdminCatalogOptions = { categories: { id: string; name: string }[]; series: { id: string; name: string }[] };

// --- Dashboard del admin (RF-A30) ---
export type OrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'NEEDS_REVIEW' | 'PREPARING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';

export type AdminDashboard = {
  salesTodayCents: number; // órdenes PAID..DELIVERED desde la medianoche de Lima
  sales30dCents: number;
  avgTicketCents: number; // de los últimos 30 días
  ordersToShip: number; // PAID + PREPARING
  lowStock: { productId: string; name: string; sku: string; color: string; size: string; stock: number; lowStockAt: number }[];
  recentOrders: { id: string; number: string; email: string; status: OrderStatus; totalCents: number; createdAt: string }[];
};

// Códigos de error de guardado (409/422); la web los traduce.
export type AdminSaveError = 'code_taken' | 'slug_taken' | 'invalid_category' | 'need_variant_price' | 'need_image_alt' | 'invalid_tech_specs' | 'color_taken' | 'color_in_use';
