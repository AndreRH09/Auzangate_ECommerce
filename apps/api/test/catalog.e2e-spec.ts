import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { setupApp } from '../src/setup.js';

// Requiere el catálogo del seed (pnpm db:seed catalog): 22 productos, 1 en borrador (Pantalón AV02).
describe('Catálogo (e2e)', () => {
  let app: INestApplication<App>;
  const get = (url: string) => request(app.getHttpServer()).get(url);

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = setupApp(mod.createNestApplication());
    await app.init();
  });

  afterAll(() => app.close());

  it('categorías en árbol, traducidas', async () => {
    const { body } = await get('/v1/categories?locale=en').expect(200);
    expect(body.map((c: { slug: string }) => c.slug)).toEqual(['men', 'women', 'accessories']);
    expect(body[0].children).toHaveLength(3);
    expect(body[0].alternates).toEqual({ es: 'hombre', en: 'men' });
  });

  it('listado: solo publicados, paginado por cursor', async () => {
    const all = await get('/v1/products?locale=es').expect(200);
    expect(all.body.total).toBe(21);

    const page = await get('/v1/products?locale=es&limit=5').expect(200);
    expect(page.body.items).toHaveLength(5);
    expect(page.body.nextCursor).toBe('5');
    const next = await get(`/v1/products?locale=es&limit=5&cursor=${page.body.nextCursor}`).expect(200);
    expect(next.body.items[0].id).not.toBe(page.body.items[0].id);
  });

  it('categoría padre incluye hijas; orden por precio', async () => {
    const { body } = await get('/v1/products?locale=es&category=hombre&sort=price_asc').expect(200);
    expect(body.total).toBe(8);
    const prices = body.items.map((p: { priceCents: number }) => p.priceCents);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  it('filtros de serie, talla y búsqueda', async () => {
    expect((await get('/v1/products?locale=es&series=wari').expect(200)).body.total).toBe(5);
    expect((await get('/v1/products?locale=es&size=XS').expect(200)).body.total).toBe(9);
    // "aw01" encuentra la versión de hombre (AW01) y la de mujer (FAW01)
    expect((await get('/v1/products?locale=en&q=aw01').expect(200)).body.total).toBe(2);
  });

  it('ficha con slugs alternos; borrador da 404', async () => {
    const { body } = await get('/v1/products/casaca-faw01?locale=es').expect(200);
    expect(body.code).toBe('FAW01');
    expect(body.alternates.en).toBe('jacket-faw01');
    expect(body.category.parent.slug).toBe('mujer');
    expect(body.variants[0].sku).toMatch(/^FAW01-[A-Z]-/);
    await get('/v1/products/pantalon-av02?locale=es').expect(404);
  });

  it('valida parámetros', async () => {
    await get('/v1/products?locale=fr').expect(400);
    await get('/v1/products?sort=random').expect(400);
  });

  it('feed del sitemap', async () => {
    const { body } = await get('/v1/catalog/sitemap').expect(200);
    expect(body.products).toHaveLength(21);
    expect(body.products[0].slugs).toHaveProperty('en');
  });
});
