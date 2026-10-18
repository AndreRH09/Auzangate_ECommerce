import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// ponytail: sin incremental cache todavía; en F1 se agrega R2 para que el ISR persista entre requests.
export default defineCloudflareConfig();
