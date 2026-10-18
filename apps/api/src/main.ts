import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import type { Env } from './config/env.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true }); // rawBody: firma del webhook de Stripe (F2)
  const config = app.get<ConfigService<Env, true>>(ConfigService);

  app.use(helmet());
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' }); // rutas bajo /v1
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.enableShutdownHooks();

  if (config.get('SWAGGER_ENABLED', { infer: true })) {
    const doc = new DocumentBuilder()
      .setTitle('AUZANGATE API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('docs', app, () => SwaggerModule.createDocument(app, doc), {
      jsonDocumentUrl: 'docs/json',
    });
  }

  await app.listen(config.get('PORT', { infer: true }));
}
await bootstrap();
