import { getCloudflareContext } from "@opennextjs/cloudflare";
import { contentRange } from "@/lib/range";

// Fotos y videos de R2 (F1·5). Las claves llevan un UUID o hash y nunca se reescriben: caché inmutable en el navegador y el CDN.
// Range: Safari/iOS no reproduce un <video> si el servidor no responde 206 a "Range: bytes=0-1".
// ponytail: cada archivo pasa por el Worker; con un dominio público del bucket basta cambiar IMAGE_BASE_URL en la API.
export async function GET(request: Request, { params }: RouteContext<"/media/[...key]">) {
  const { env } = await getCloudflareContext({ async: true });
  const obj = await env.MEDIA.get((await params).key.join("/"), { range: request.headers });
  if (!obj) return new Response("Not found", { status: 404 });
  const headers = new Headers({
    "content-type": obj.httpMetadata?.contentType ?? "application/octet-stream",
    "cache-control": "public, max-age=31536000, immutable",
    "accept-ranges": "bytes",
    etag: obj.httpEtag,
  });
  if (!obj.range || !request.headers.has("range")) return new Response(obj.body, { headers });
  const { start, end } = contentRange(obj.range, obj.size);
  headers.set("content-range", `bytes ${start}-${end}/${obj.size}`);
  headers.set("content-length", String(end - start + 1));
  return new Response(obj.body, { status: 206, headers });
}
