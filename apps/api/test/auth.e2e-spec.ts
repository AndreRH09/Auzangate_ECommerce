import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { hash } from '@node-rs/argon2';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { setupApp } from '../src/setup.js';

// Crea sus propios usuarios (no depende del seed). Re-ejecutable.
const ADMIN = { email: 'e2e-admin@test.local', password: 'clave-de-prueba-123' };
const CUSTOMER = { email: 'e2e-cliente@test.local', password: 'clave-de-prueba-123' };

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  const login = (body: object) => request(app.getHttpServer()).post('/v1/auth/login').send(body);
  const me = (token?: string) => {
    const req = request(app.getHttpServer()).get('/v1/auth/me');
    return token ? req.set('authorization', `Bearer ${token}`) : req;
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = setupApp(moduleRef.createNestApplication());
    await app.init();
    const prisma = app.get(PrismaService);
    const passwordHash = await hash(ADMIN.password);
    for (const [u, role] of [[ADMIN, 'ADMIN'], [CUSTOMER, 'CUSTOMER']] as const) {
      await prisma.user.upsert({
        where: { email: u.email },
        update: { role, status: 'ACTIVE', passwordHash },
        create: { email: u.email, name: 'E2E', role, passwordHash },
      });
    }
  });

  afterAll(() => app.close());

  it('admin entra y /me lo identifica', async () => {
    const { body } = await login(ADMIN).expect(200);
    expect(body.expiresIn).toBe(8 * 3600);
    const res = await me(body.accessToken).expect(200);
    expect(res.body).toMatchObject({ email: ADMIN.email, name: 'E2E' });
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('rechaza contraseña incorrecta, email inexistente y clientes con el mismo 401', async () => {
    await login({ ...ADMIN, password: 'incorrecta-123' }).expect(401);
    await login({ email: 'nadie@test.local', password: 'x' }).expect(401);
    await login(CUSTOMER).expect(401);
    await login({ email: 'no-es-email' }).expect(400);
  });

  it('/me sin token o con token alterado da 401', async () => {
    await me().expect(401);
    const { body } = await login(ADMIN).expect(200);
    await me(`${body.accessToken}x`).expect(401);
  });

  it('admin bloqueado pierde acceso aunque su token siga vigente', async () => {
    const { body } = await login(ADMIN).expect(200);
    const prisma = app.get(PrismaService);
    await prisma.user.update({ where: { email: ADMIN.email }, data: { status: 'BLOCKED' } });
    await me(body.accessToken).expect(401);
    await prisma.user.update({ where: { email: ADMIN.email }, data: { status: 'ACTIVE' } });
  });

  it('limita intentos de login por email (5/min)', async () => {
    const email = 'fuerza-bruta@test.local';
    for (let i = 0; i < 5; i++) await login({ email, password: 'x' }).expect(401);
    await login({ email, password: 'x' }).expect(429);
  });
});
