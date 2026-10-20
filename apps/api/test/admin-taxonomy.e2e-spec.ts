import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import type { AdminCategory, AdminSeries } from '../src/contract.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { setupApp } from '../src/setup.js';
import { adminToken } from './admin.js';

// Requiere el seed: 4 categorías principales con productos y las 5 series.
describe('Admin de categorías y series (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;
  const call = (method: 'get' | 'post' | 'put' | 'delete', path: string) =>
    request(app.getHttpServer())[method](`/v1/admin${path}`).set('authorization', `Bearer ${token}`);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = setupApp(moduleRef.createNestApplication());
    await app.init();
    token = await adminToken(app);
  });

  afterAll(async () => {
    await app.get(PrismaService).category.deleteMany({ where: { translations: { some: { slug: { startsWith: 'temporal-' } } } } });
    await app.close();
  });

  it('exige sesión de admin', async () => {
    await request(app.getHttpServer()).get('/v1/admin/categories').expect(401);
  });

  it('categorías: crea subcategoría, respeta 2 niveles, slugs únicos y solo borra vacías', async () => {
    const all = (await call('get', '/categories').expect(200)).body as AdminCategory[];
    const jackets = all.find((c) => c.slugs.es === 'casacas')!;
    expect(jackets).toMatchObject({ parentId: null, names: { es: 'Casacas', en: 'Jackets' } });
    expect(jackets.products).toBeGreaterThan(0);

    const names = { es: 'Temporal Plumas', en: 'Temporal Down' };
    const created = ((await call('post', '/categories').send({ parentId: jackets.id, sort: 9, names }).expect(201)).body as AdminCategory[]).find(
      (c) => c.slugs.es === 'temporal-plumas',
    )!;
    expect(created).toMatchObject({ parentId: jackets.id, sort: 9, slugs: { en: 'temporal-down' }, products: 0 });

    // una hija no puede tener hijas, ni una principal con hijas colgar de otra
    expect((await call('post', '/categories').send({ parentId: created.id, sort: 0, names: { es: 'Temporal X', en: 'Temporal X' } }).expect(400)).body.message).toEqual(['category_depth']);
    const other = all.find((c) => c.slugs.es === 'capas')!;
    expect((await call('put', `/categories/${jackets.id}`).send({ parentId: other.id, sort: 0, names: jackets.names }).expect(400)).body.message).toEqual(['category_depth']);
    expect((await call('post', '/categories').send({ parentId: null, sort: 0, names: { es: 'Casacas', en: 'Temporal Y' } }).expect(409)).body.message).toEqual(['slug_taken']);

    const renamed = ((await call('put', `/categories/${created.id}`).send({ parentId: null, sort: 1, names: { es: 'Temporal Plumón', en: 'Temporal Down' } }).expect(200))
      .body as AdminCategory[]).find((c) => c.id === created.id)!;
    expect(renamed).toMatchObject({ parentId: null, slugs: { es: 'temporal-plumon' } });

    expect((await call('delete', `/categories/${jackets.id}`).expect(409)).body.message).toEqual(['category_in_use']);
    const left = (await call('delete', `/categories/${created.id}`).expect(200)).body as AdminCategory[];
    expect(left.some((c) => c.id === created.id)).toBe(false);
    await call('delete', `/categories/${created.id}`).expect(404);
  });

  it('series: se editan (nombre, descripción, orden) sin crear ni borrar', async () => {
    const series = (await call('get', '/series').expect(200)).body as AdminSeries[];
    expect(series.map((s) => s.code)).toEqual(['CARAL', 'WARI', 'SICAN', 'VICUS', 'NASCA']);
    const caral = series[0]!;
    const input = (description: string) => ({
      sort: caral.sort,
      translations: { es: { name: caral.translations.es.name, description }, en: { name: caral.translations.en.name, description: caral.translations.en.description } },
    });
    try {
      const saved = ((await call('put', `/series/${caral.id}`).send(input('Classic. Editada.')).expect(200)).body as AdminSeries[])[0]!;
      expect(saved.translations.es).toMatchObject({ slug: 'caral', description: 'Classic. Editada.' });
      const shop = await request(app.getHttpServer()).get('/v1/series?locale=es').expect(200);
      expect(shop.body[0].description).toBe('Classic. Editada.');
      const clash = { ...input('x'), translations: { ...input('x').translations, es: { name: 'Wari', description: 'x' } } };
      expect((await call('put', `/series/${caral.id}`).send(clash).expect(409)).body.message).toEqual(['slug_taken']);
    } finally {
      await call('put', `/series/${caral.id}`).send(input(caral.translations.es.description)).expect(200);
    }
    await call('post', '/series').send({}).expect(404);
  });
});
