import { type INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import helmet from 'helmet';

// Configuración compartida por main.ts y los tests e2e (mismas rutas /v1 y misma validación).
export function setupApp(app: INestApplication) {
  app.use(helmet());
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' }); // rutas bajo /v1
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  return app;
}
