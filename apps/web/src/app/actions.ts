"use server";

import { getLocale } from "next-intl/server";

const API_URL = process.env.API_URL ?? "http://localhost:3000";

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
