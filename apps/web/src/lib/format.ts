// Copia de apps/api/src/slugify.ts (la API es la que guarda; esto solo previsualiza el slug en el admin).
export const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const formatPrice =(cents: number) => `S/ ${(cents / 100).toFixed(2)}`;

export const SITE_URL = process.env.SITE_URL ?? "http://localhost:3001";
