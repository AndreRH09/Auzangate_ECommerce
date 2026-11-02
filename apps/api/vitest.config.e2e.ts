import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // una sola BD compartida: en paralelo, el upsert del admin de prueba (test/admin.ts) choca con User_email_key
    fileParallelism: false,
  },
});
