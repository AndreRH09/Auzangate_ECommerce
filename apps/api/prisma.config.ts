import { config } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

// Prisma 7 ya no lee .env solo. En dev está en la raíz del monorepo; en Docker no existe y no pasa nada.
config({ path: '../../.env', quiet: true });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: env('DATABASE_URL') },
});
