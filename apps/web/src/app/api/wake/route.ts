import { API_URL } from "@/lib/api";

// Despierta la API de Render (free duerme tras 15 min). El navegador no puede llamarla directo (sin CORS),
// así que la pantalla de carga de [locale]/error.tsx sondea esta ruta hasta recibir 200.
export async function GET() {
  const res = await fetch(`${API_URL}/v1/series?locale=es`, { cache: "no-store", signal: AbortSignal.timeout(25_000) }).catch(() => null);
  return new Response(null, { status: res?.ok ? 200 : 503, headers: { "cache-control": "no-store" } });
}
