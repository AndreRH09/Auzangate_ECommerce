import { z } from 'zod';

// Si falta o está mal una variable, la API no arranca y dice cuál.
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().default(3000),
  DATABASE_URL: z.url({ protocol: /^mysql$/ }),
  SWAGGER_ENABLED: z.stringbool().default(true),
  // base pública del bucket R2 (sin "/" final); las claves del seed son URLs absolutas y no la usan
  IMAGE_BASE_URL: z.string().default(''),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`Variables de entorno inválidas:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
