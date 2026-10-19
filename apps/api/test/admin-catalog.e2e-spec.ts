import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import type { AdminProduct, AdminProductInput, AdminProductList } from '../src/contract.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
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

  describe('editar producto', () => {
    const put = (id: string, body: object) =>
      request(app.getHttpServer()).put(`/v1/admin/products/${id}`).set('authorization', `Bearer ${token}`).send(body);
    const detail = async (id: string) =>
      (await request(app.getHttpServer()).get(`/v1/admin/products/${id}`).set('authorization', `Bearer ${token}`).expect(200)).body as AdminProduct;
    let original: AdminProduct;

    beforeAll(async () => {
      original = await detail((await list('&q=ac03')).items[0]!.id);
    });
    // deja el seed como estaba aunque un test falle a la mitad
    // cuerpo del PUT: solo los campos editables
    const toInput = ({ code, status, gender, categoryId, seriesId, translations }: AdminProduct) =>
      ({ code, status, gender, categoryId, seriesId, translations }) satisfies AdminProductInput;
    afterAll(async () => {
      await put(original.id, toInput(original)).expect(200);
    });

    const input = (patch: (p: AdminProduct) => void) => {
      const p = structuredClone(original);
      patch(p);
      return toInput(p);
    };

    it('guarda, genera el slug vacío y la tienda lo refleja', async () => {
      const { body } = await put(original.id, input((p) => {
        p.translations.es.subtitle = 'Merino editado';
        p.translations.es.slug = '';
        p.translations.es.techSpecs = { peso: '150 g' };
      })).expect(200);
      expect(body.translations.es).toMatchObject({ slug: 'primera-capa-ac03', subtitle: 'Merino editado', techSpecs: { peso: '150 g' } });
      const shop = await request(app.getHttpServer()).get('/v1/products/primera-capa-ac03?locale=es').expect(200);
      expect(shop.body.subtitle).toBe('Merino editado');
    });

    it('código o slug repetido: 409 con el código de error', async () => {
      expect((await put(original.id, input((p) => (p.code = 'AW01'))).expect(409)).body.message).toEqual(['code_taken']);
      expect((await put(original.id, input((p) => (p.translations.es.slug = 'casaca-aw01'))).expect(409)).body.message).toEqual(['slug_taken']);
    });

    it('valida formato de código, techSpecs y categoría', async () => {
      await put(original.id, input((p) => (p.code = 'XX1'))).expect(400);
      await put(original.id, input((p) => (p.translations.en.techSpecs = { peso: 5 as unknown as string }))).expect(400);
      expect((await put(original.id, input((p) => (p.categoryId = 'no-existe'))).expect(400)).body.message).toEqual(['invalid_category']);
    });

    it('no publica sin variante con precio ni imagen con alt (RF-A08)', async () => {
      const prisma = app.get(PrismaService);
      const t = { name: 'Temporal AN99', subtitle: '', description: '', techSpecs: {} };
      const temp = await prisma.product.create({
        data: {
          code: 'AN99',
          categoryId: original.categoryId,
          translations: { create: [{ locale: 'es', slug: 'temporal-an99', ...t }, { locale: 'en', slug: 'temp-an99', ...t }] },
        },
      });
      try {
        const res = await put(temp.id, { ...input(() => {}), code: 'AN99', status: 'PUBLISHED', translations: { es: { ...t, slug: 'temporal-an99' }, en: { ...t, slug: 'temp-an99' } } }).expect(422);
        expect(res.body.message).toEqual(['need_variant_price', 'need_image_alt']);
      } finally {
        await prisma.product.delete({ where: { id: temp.id } });
      }
    });
  });

  it('opciones del formulario con ids', async () => {
    const { body } = await request(app.getHttpServer()).get('/v1/admin/catalog-options?locale=es').set('authorization', `Bearer ${token}`).expect(200);
    expect(body.categories.map((c: { name: string }) => c.name)).toEqual(['Casacas', 'Capas', 'Pantalones', 'Accesorios']);
    expect(body.series).toHaveLength(5);
  });

  it('rechaza filtros inválidos', async () => {
    await request(app.getHttpServer()).get('/v1/admin/products?status=OTRO').set('authorization', `Bearer ${token}`).expect(400);
  });
});
