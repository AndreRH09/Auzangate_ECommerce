import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AdminCatalogModule } from './admin/admin-catalog.controller.js';
import { AuthModule } from './auth/auth.controller.js';
import { CatalogModule } from './catalog/catalog.module.js';
import { validateEnv } from './config/env.js';
import { HealthController } from './health/health.controller.js';
import { NewsletterModule } from './newsletter/newsletter.controller.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // dev: el .env vive en la raíz del monorepo. En Docker/Render no existe y se usan las variables del entorno.
      envFilePath: '../../.env',
      validate: validateEnv,
    }),
    // Solo lo usan los endpoints que escriben (@UseGuards(ThrottlerGuard)), no es global: el build de Next
    // pide todo el catálogo desde una sola IP y un límite global lo cortaría.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 20 }]),
    PrismaModule,
    AuthModule,
    AdminCatalogModule,
    CatalogModule,
    NewsletterModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
