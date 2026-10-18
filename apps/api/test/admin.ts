import type { INestApplication } from '@nestjs/common';
import { hash } from '@node-rs/argon2';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

export const E2E_ADMIN = { email: 'e2e-admin@test.local', password: 'clave-de-prueba-123' };

// Asegura el admin de prueba (activo) y devuelve un token suyo.
export async function adminToken(app: INestApplication<App>) {
  await app.get(PrismaService).user.upsert({
    where: { email: E2E_ADMIN.email },
    update: { role: 'ADMIN', status: 'ACTIVE', passwordHash: await hash(E2E_ADMIN.password) },
    create: { email: E2E_ADMIN.email, name: 'E2E', role: 'ADMIN', passwordHash: await hash(E2E_ADMIN.password) },
  });
  const { body } = await request(app.getHttpServer()).post('/v1/auth/login').send(E2E_ADMIN).expect(200);
  return (body as { accessToken: string }).accessToken;
}
