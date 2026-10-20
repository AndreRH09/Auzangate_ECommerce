import { notFound } from "next/navigation";
import type { Category, Product, ProductList, Series, SitemapFeed } from "@api/contract";
import type { Locale } from "@/i18n/routing";

// Tipos de las respuestas: vienen del contrato de la API (apps/api/src/contract.ts), no se escriben aquí.
export type * from "@api/contract";

export const API_URL = process.env.API_URL ?? "http://localhost:3000";

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
