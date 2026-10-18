"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { ADMIN_COOKIE } from "@/lib/admin";
import { API_URL, type LoginResponse } from "@/lib/api";

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

export async function logout() {
  (await cookies()).delete(ADMIN_COOKIE);
  redirect(`/${await getLocale()}/admin/login`);
}
