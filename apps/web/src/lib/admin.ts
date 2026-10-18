import { cookies } from "next/headers"; // solo servidor: importarlo desde un client component falla en el build
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { type Admin, API_URL } from "./api";

// Sesión del admin: el JWT vive en una cookie httpOnly; el navegador nunca lo ve ni llama a la API (BFF).
export const ADMIN_COOKIE = "admin_token";

export const adminToken = async () => (await cookies()).get(ADMIN_COOKIE)?.value;

// null si no hay sesión o la API la rechaza (vencida, admin bloqueado). Sin caché: es por usuario.
export async function getAdmin(): Promise<Admin | null> {
  const token = await adminToken();
  if (!token) return null;
  const res = await fetch(`${API_URL}/v1/auth/me`, { headers: { authorization: `Bearer ${token}` }, cache: "no-store" }).catch(() => null);
  return res?.ok ? ((await res.json()) as Admin) : null;
}

// Llamadas a /v1/admin/* con el token de la cookie. Si la sesión venció, vuelve al login.
export async function adminApi<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}/v1/admin${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers, authorization: `Bearer ${await adminToken()}` },
    cache: "no-store",
  });
  if (res.status === 401) redirect(`/${await getLocale()}/admin/login`);
  if (!res.ok) throw new Error(`API ${res.status} en /admin${path}`);
  return (await res.json()) as T;
}
