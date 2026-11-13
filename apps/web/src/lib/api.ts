import { notFound } from "next/navigation";
import type { Category, Product, ProductList, Series, SitemapFeed } from "@api/contract";
import { hasLocale } from "next-intl";
import { routing, type Locale } from "@/i18n/routing";

// Tipos de las respuestas: vienen del contrato de la API (apps/api/src/contract.ts), no se escriben aquí.
export type * from "@api/contract";

export const API_URL = process.env.API_URL ?? "http://localhost:3000";

// ISR: datos cacheados 1 h + invalidación inmediata por tag (POST /api/revalidate desde el admin).
// Si la API de Render duerme, la tienda sigue sirviendo desde esta caché.
async function api<T>(path: string, tags: string[]): Promise<T> {
  // Render free tarda ~30-60 s en despertar y mientras responde 502/503 o corta: reintenta antes de dar 500.
  let res: Response | undefined;
  for (let i = 0; i < 3; i++) {
    if (i) await new Promise((r) => setTimeout(r, 5000));
    res = await fetch(`${API_URL}/v1${path}`, { next: { revalidate: 3600, tags: ["catalog", ...tags] } }).catch(() => undefined);
    if (res && res.status < 500) break;
  }
  if (!res) throw new Error(`API sin respuesta en ${path}`);
  if (res.status === 404) notFound();
  if (!res.ok) throw new Error(`API ${res.status} en ${path}`);
  return res.json() as Promise<T>;
}

// [locale] atrapa cualquier segmento (/favicon.ico, /wp-admin…) y los layouts renderizan en paralelo: el
// notFound() del layout raíz no frena los fetch del header. Sin esta guarda la API responde 400 y la página da 500.
const loc = (l: string) => (hasLocale(routing.locales, l) ? l : notFound());

export const getCategories = (locale: Locale) => api<Category[]>(`/categories?locale=${loc(locale)}`, ["categories"]);
export const getSeries = (locale: Locale) => api<Series[]>(`/series?locale=${loc(locale)}`, ["series"]);
export const getProduct = (slug: string, locale: Locale) =>
  api<Product>(`/products/${encodeURIComponent(slug)}?locale=${loc(locale)}`, [`product:${slug}`]);
export const getSitemapFeed = () => api<SitemapFeed>("/catalog/sitemap", ["sitemap"]);

export function getProducts(locale: Locale, filters: Record<string, string | undefined> = {}) {
  const qs = new URLSearchParams({ locale: loc(locale) });
  for (const [k, v] of Object.entries(filters)) if (v) qs.set(k, v);
  return api<ProductList>(`/products?${qs}`, ["products"]);
}
