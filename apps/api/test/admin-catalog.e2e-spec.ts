import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import type { AdminProductList } from '../src/contract.js';
import { setupApp } from '../src/setup.js';
import { adminToken } from './admin.js';

// Requiere el catálogo del seed: 13 productos unisex, 1 en borrador (Pantalón AV02).
describe('Admin de catálogo (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;
  const list = async (qs = '') =>
    (await request(app.getHttpServer()).get(`/v1/admin/products?locale=es${qs}`).set('authorization', `Bearer ${token}`).expect(200))
      .body as AdminProductList;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = setupApp(moduleRef.createNestApplication());
    await app.init();
    token = await adminToken(app);
  });

  afterAll(() => app.close());

  it('exige sesión de admin', async () => {
    await request(app.getHttpServer()).get('/v1/admin/products').expect(401);
  });

  it('lista todos los estados, incluido el borrador', async () => {
    const all = await list();
    expect(all.total).toBe(13);
    const drafts = await list('&status=DRAFT');
    expect(drafts.items.map((p) => p.code)).toEqual(['AV02']);
    expect(drafts.items[0]).toMatchObject({ name: 'Pantalón AV02', series: 'VICUS', status: 'DRAFT', gender: 'UNISEX' });
  });

  it('filtra por género exacto (sin sumar unisex)', async () => {
    expect((await list('&gender=UNISEX')).total).toBe(13);
    expect((await list('&gender=WOMEN')).total).toBe(0);
  });

  it('busca por código y por nombre, ordena por código y pagina', async () => {
    expect((await list('&q=aw01')).items.map((p) => p.code)).toEqual(['AW01']);
    expect((await list('&q=chaleco')).total).toBeGreaterThan(0);
    const codes = (await list('&sort=code')).items.map((p) => p.code);
    expect(codes).toEqual([...codes].sort());
    const page2 = await list('&page=2');
    expect(page2).toMatchObject({ page: 2, pageSize: 25, items: [] });
  });

  it('rechaza filtros inválidos', async () => {
    await request(app.getHttpServer()).get('/v1/admin/products?status=OTRO').set('authorization', `Bearer ${token}`).expect(400);
  });
});
