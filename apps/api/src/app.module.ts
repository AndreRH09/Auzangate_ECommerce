import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CatalogModule } from './catalog/catalog.module.js';
import { validateEnv } from './config/env.js';
import { HealthController } from './health/health.controller.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // dev: el .env vive en la raíz del monorepo. En Docker/Render no existe y se usan las variables del entorno.
      envFilePath: '../../.env',
      validate: validateEnv,
    }),
    PrismaModule,
    CatalogModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
