// Bindings de wrangler.jsonc que usa la app (getCloudflareContext().env).
// ponytail: tipo mínimo de R2 con lo que se usa; `wrangler types` genera el completo si hace falta más.
interface CloudflareEnv {
  MEDIA: {
    put(key: string, value: ArrayBuffer, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
    get(key: string): Promise<{ body: ReadableStream; httpEtag: string; httpMetadata?: { contentType?: string } } | null>;
    delete(key: string): Promise<void>;
  };
}
