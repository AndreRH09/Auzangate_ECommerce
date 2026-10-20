import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import memoryQueue from "@opennextjs/cloudflare/overrides/queue/memory-queue";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import d1NextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache";

// ISR persistente (plan §10): páginas y fetch cacheados en R2 (binding NEXT_INC_CACHE_R2_BUCKET), así la tienda
// sigue sirviendo aunque la API de Render duerma. updateTag("catalog") del admin se registra en D1 (NEXT_TAG_CACHE_D1;
// `opennextjs-cloudflare deploy` crea su tabla).
// ponytail: cola en memoria para la revalidación por tiempo (1 h); pasar a la de Durable Objects si hay tráfico real.
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  tagCache: d1NextTagCache,
  queue: memoryQueue,
});
