"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { ADMIN_COOKIE, AdminApiError, adminApi, getAdmin } from "@/lib/admin";
import { type AdminColorDelete, type AdminImage, type AdminProduct, type AdminProductInput, API_URL, type LoginResponse } from "@/lib/api";

// BFF: el navegador nunca llama a la API directo (plan §1)
export async function subscribe(_: unknown, form: FormData): Promise<"ok" | "error"> {
  const email = String(form.get("email") ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return "error";
  const res = await fetch(`${API_URL}/v1/newsletter`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, locale: await getLocale() }),
  }).catch(() => null);
  return res?.ok ? "ok" : "error";
}

// Devuelve el email para que el formulario lo conserve (React lo resetea tras cada envío).
export async function login(_: unknown, form: FormData): Promise<{ error: "error" | "throttled"; email: string }> {
  const email = String(form.get("email") ?? "").trim();
  const res = await fetch(`${API_URL}/v1/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: String(form.get("password") ?? "") }),
  }).catch(() => null);
  if (!res?.ok) return { error: res?.status === 429 ? "throttled" : "error", email };

  const { accessToken, expiresIn } = (await res.json()) as LoginResponse;
  (await cookies()).set(ADMIN_COOKIE, accessToken, {
    httpOnly: true, // JS del navegador no lo lee (XSS)
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict", // no viaja en requests desde otros sitios (CSRF)
    path: "/",
    maxAge: expiresIn,
  });
  redirect(`/${await getLocale()}/admin`);
}

// Filas specKey/specValue del formulario (mismo orden) -> { peso: "420 g" }. Filas sin clave se ignoran.
const parseSpecs = (form: FormData, l: Locale) => {
  const values = form.getAll(`${l}.specValue`).map(String);
  return Object.fromEntries(
    form.getAll(`${l}.specKey`).flatMap((k, i) => (String(k).trim() ? [[String(k).trim(), values[i]?.trim() ?? ""]] : [])),
  );
};

export type SaveState = { ok: true; product: AdminProduct } | { ok: false; errors: string[] } | null;

// RF-A02/A03/A07. Guarda y expira la caché de la tienda: el cambio se ve en la siguiente visita.
export async function saveProduct(id: string, _: SaveState, form: FormData): Promise<SaveState> {
  const text = (name: string) => String(form.get(name) ?? "");
  const translation = (l: Locale) => ({
    name: text(`${l}.name`),
    subtitle: text(`${l}.subtitle`),
    description: text(`${l}.description`),
    techSpecs: parseSpecs(form, l),
  });
  const body: AdminProductInput = {
    code: text("code").trim().toUpperCase(),
    status: text("status") as AdminProductInput["status"],
    gender: text("gender") as AdminProductInput["gender"],
    categoryId: text("categoryId"),
    seriesId: text("seriesId") || null,
    translations: { es: translation("es"), en: translation("en") },
    // soles con 2 decimales -> céntimos; sin campo (producto sin variantes) no se toca
    priceCents: form.has("price") ? Math.round(Number(text("price")) * 100) : undefined,
    // fotos: inputs repetidos img.* en el orden de la galería
    images: form.getAll("img.id").map((imgId, i) => ({
      id: String(imgId),
      colorHex: String(form.getAll("img.color")[i] ?? "") || null,
      altEs: String(form.getAll("img.altEs")[i] ?? ""),
      altEn: String(form.getAll("img.altEn")[i] ?? ""),
    })),
    // colores de variantes: inputs repetidos color.*
    colors: form.getAll("color.from").map((from, i) => ({
      from: String(from),
      hex: String(form.getAll("color.hex")[i] ?? ""),
      nameEs: String(form.getAll("color.nameEs")[i] ?? ""),
      nameEn: String(form.getAll("color.nameEn")[i] ?? ""),
    })),
  };
  try {
    const product = await adminApi<AdminProduct>(`/products/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(body) });
    updateTag("catalog"); // todos los fetch de la tienda llevan este tag (lib/api.ts)
    return { ok: true, product };
  } catch (e) {
    if (e instanceof AdminApiError) return { ok: false, errors: e.messages };
    throw e;
  }
}

const IMAGE_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export type ImageState = { ok: true; image: AdminImage } | { ok: false; errors: string[] };

// F1·5. El archivo va a R2 (binding MEDIA) y luego la API registra la fila. Sin alt: se completa y se guarda con el formulario.
// ponytail: se guarda el archivo tal cual; WebP/AVIF y tamaños con Cloudflare Images cuando se active.
export async function uploadImage(productId: string, form: FormData): Promise<ImageState> {
  // R2 se escribe antes que la API: la sesión se comprueba primero
  if (!(await getAdmin())) redirect(`/${await getLocale()}/admin/login`);
  const file = form.get("file");
  const ext = file instanceof File ? IMAGE_TYPES[file.type] : undefined;
  if (!(file instanceof File) || !ext || !/^[a-z0-9]+$/.test(productId)) return { ok: false, errors: ["image_type"] };
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, errors: ["image_size"] };

  const r2Key = `products/${productId}/${crypto.randomUUID()}.${ext}`;
  const { env } = await getCloudflareContext({ async: true });
  await env.MEDIA.put(r2Key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
  try {
    const product = await adminApi<AdminProduct>(`/products/${productId}/images`, {
      method: "POST",
      body: JSON.stringify({ r2Key, width: Number(form.get("width")), height: Number(form.get("height")) }),
    });
    return { ok: true, image: product.images.at(-1)! }; // se agrega al final de la galería
  } catch (e) {
    await env.MEDIA.delete(r2Key); // sin fila en la BD el archivo quedaría huérfano
    if (e instanceof AdminApiError) return { ok: false, errors: e.messages };
    throw e;
  }
}

export async function deleteImage(productId: string, imageId: string) {
  const { r2Key } = await adminApi<{ r2Key: string }>(`/products/${encodeURIComponent(productId)}/images/${encodeURIComponent(imageId)}`, { method: "DELETE" });
  // las fotos del seed son rutas del front o URLs externas, no están en R2
  if (r2Key.startsWith("products/")) await (await getCloudflareContext({ async: true })).env.MEDIA.delete(r2Key);
  updateTag("catalog"); // la tienda no debe seguir apuntando al archivo borrado
}

// Borra un color: variantes + fotos en la API (una transacción) y después sus archivos de R2.
export async function deleteColor(productId: string, body: AdminColorDelete): Promise<{ ok: true } | { ok: false; errors: string[] }> {
  try {
    const { r2Keys } = await adminApi<{ r2Keys: string[] }>(`/products/${encodeURIComponent(productId)}/colors`, { method: "DELETE", body: JSON.stringify(body) });
    const { env } = await getCloudflareContext({ async: true });
    await Promise.all(r2Keys.filter((k) => k.startsWith("products/")).map((k) => env.MEDIA.delete(k)));
    updateTag("catalog");
    return { ok: true };
  } catch (e) {
    if (e instanceof AdminApiError) return { ok: false, errors: e.messages };
    throw e;
  }
}

export async function logout() {
  (await cookies()).delete(ADMIN_COOKIE);
  redirect(`/${await getLocale()}/admin/login`);
}
