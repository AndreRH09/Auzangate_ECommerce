import { getCloudflareContext } from "@opennextjs/cloudflare";

// Fotos de R2 (F1·5). Las claves llevan un UUID y nunca se reescriben: caché inmutable en el navegador y el CDN.
// ponytail: cada foto pasa por el Worker; con un dominio público del bucket basta cambiar IMAGE_BASE_URL en la API.
export async function GET(_: Request, { params }: RouteContext<"/media/[...key]">) {
  const { env } = await getCloudflareContext({ async: true });
  const obj = await env.MEDIA.get((await params).key.join("/"));
  if (!obj) return new Response("Not found", { status: 404 });
  return new Response(obj.body, {
    headers: {
      "content-type": obj.httpMetadata?.contentType ?? "application/octet-stream",
      "cache-control": "public, max-age=31536000, immutable",
      etag: obj.httpEtag,
    },
  });
}
