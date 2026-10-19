"use server";

import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { ADMIN_COOKIE, AdminApiError, adminApi } from "@/lib/admin";
import { type AdminProduct, type AdminProductInput, API_URL, type LoginResponse } from "@/lib/api";

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
    slug: text(`${l}.slug`).trim() || undefined,
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
    translations: { es: translation("es"), en: translation("en") } as AdminProductInput["translations"],
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

export async function logout() {
  (await cookies()).delete(ADMIN_COOKIE);
  redirect(`/${await getLocale()}/admin/login`);
}
