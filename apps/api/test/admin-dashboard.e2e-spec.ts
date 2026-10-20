import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import type { AdminDashboard } from '../src/contract.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { setupApp } from '../src/setup.js';
import { adminToken } from './admin.js';

// Requiere el catálogo del seed. Las órdenes llegan en F2: hoy los KPIs de venta dan 0.
describe('Dashboard del admin (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let token: string;
  const get = async () =>
    (await request(app.getHttpServer()).get('/v1/admin/dashboard?locale=es').set('authorization', `Bearer ${token}`).expect(200))
      .body as AdminDashboard;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = setupApp(moduleRef.createNestApplication());
    await app.init();
    prisma = app.get(PrismaService);
    token = await adminToken(app);
  });

  afterAll(() => app.close());

  it('exige sesión de admin', async () => {
    await request(app.getHttpServer()).get('/v1/admin/dashboard').expect(401);
  });

  it('devuelve KPIs y listas acotadas', async () => {
    const d = await get();
    for (const k of ['salesTodayCents', 'sales30dCents', 'avgTicketCents', 'ordersToShip'] as const) expect(d[k]).toBeGreaterThanOrEqual(0);
    expect(d.lowStock.length).toBeLessThanOrEqual(10);
    expect(d.recentOrders.length).toBeLessThanOrEqual(5);
  });

  it('una variante con stock ≤ umbral sale primero en stock bajo', async () => {
    const v = await prisma.productVariant.findFirstOrThrow({ orderBy: { sku: 'asc' } });
    await prisma.productVariant.update({ where: { id: v.id }, data: { stock: 0 } });
    try {
      const row = (await get()).lowStock.find((r) => r.sku === v.sku);
      expect(row).toMatchObject({ stock: 0, lowStockAt: v.lowStockAt, size: v.size });
      expect(row?.name).toBeTruthy();
    } finally {
      await prisma.productVariant.update({ where: { id: v.id }, data: { stock: v.stock } });
    }
  });
});
