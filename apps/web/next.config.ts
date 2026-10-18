import type { NextConfig } from "next";

// ponytail: sin cacheComponents/partialPrefetching (defaults del CLI). El plan usa ISR con
// revalidate + revalidateTag; se evalúa el modelo nuevo cuando OpenNext lo soporte estable.
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
