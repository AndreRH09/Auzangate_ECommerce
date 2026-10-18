import { notFound } from "next/navigation";
import type { Locale } from "@/i18n/routing";

// ponytail: tipos escritos a mano según las respuestas de apps/api/src/catalog. Generarlos desde
// openapi.json (packages/api-types) cuando la API tenga DTOs de respuesta y más de un consumidor.
export type Alternates = Record<Locale, string>;
export type Image = { url: string; alt: string; width: number; height: number };
export type Color = { hex: string; name: string };

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

export type Category = { name: string; slug: string; alternates: Alternates; children: Omit<Category, "children">[] };
export type Series = { code: string; name: string; slug: string; description: string; alternates: Alternates };
type Named = { name: string; slug: string; alternates: Alternates };

export type ProductList = {
  total: number;
  items: Card[];
  nextCursor: string | null;
  facets: { sizes: string[]; colors: Color[]; price: { min: number; max: number } };
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  techSpecs: Record<string, string>;
  updatedAt: string;
  alternates: Alternates;
  category: Named & { parent: Named | null };
  series: (Named & { code: string }) | null;
  variants: { id: string; sku: string; colorHex: string; colorName: string; size: string; priceCents: number; stock: number }[];
  images: Image[];
  related: Card[];
};

export type SitemapFeed = {
  products: { updatedAt: string; slugs: Alternates; images: string[] }[];
  categories: { slugs: Alternates }[];
  series: { slugs: Alternates }[];
};

const API_URL = process.env.API_URL ?? "http://localhost:3000";

// ISR: datos cacheados 1 h + invalidación inmediata por tag (POST /api/revalidate desde el admin).
// Si la API de Render duerme, la tienda sigue sirviendo desde esta caché.
async function api<T>(path: string, tags: string[]): Promise<T> {
  const res = await fetch(`${API_URL}/v1${path}`, { next: { revalidate: 3600, tags: ["catalog", ...tags] } });
  if (res.status === 404) notFound();
  if (!res.ok) throw new Error(`API ${res.status} en ${path}`);
  return res.json() as Promise<T>;
}

export const getCategories = (locale: Locale) => api<Category[]>(`/categories?locale=${locale}`, ["categories"]);
export const getSeries = (locale: Locale) => api<Series[]>(`/series?locale=${locale}`, ["series"]);
export const getProduct = (slug: string, locale: Locale) =>
  api<Product>(`/products/${encodeURIComponent(slug)}?locale=${locale}`, [`product:${slug}`]);
export const getSitemapFeed = () => api<SitemapFeed>("/catalog/sitemap", ["sitemap"]);

export function getProducts(locale: Locale, filters: Record<string, string | undefined> = {}) {
  const qs = new URLSearchParams({ locale });
  for (const [k, v] of Object.entries(filters)) if (v) qs.set(k, v);
  return api<ProductList>(`/products?${qs}`, ["products"]);
}
