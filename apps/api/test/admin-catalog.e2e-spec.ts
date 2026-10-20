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

    it('fotos: registra, edita alt/color en el PUT (con rollback si falla A08) y borra', async () => {
      const prisma = app.get(PrismaService);
      const t = { name: 'Temporal AN98', subtitle: '', description: '', techSpecs: {} };
      const temp = await prisma.product.create({
        data: { code: 'AN98', categoryId: original.categoryId, translations: { create: [{ locale: 'es', slug: 'temporal-an98', ...t }, { locale: 'en', slug: 'temp-an98', ...t }] } },
      });
      const auth = (r: request.Test) => r.set('authorization', `Bearer ${token}`);
      const r2Key = `products/${temp.id}/0f8fad5b-d9cb-469f-a165-70867728950e.webp`;
      const body = (status: string, alt: string, imageId: string) => ({
        ...input(() => {}),
        code: 'AN98',
        status,
        translations: { es: { ...t, slug: 'temporal-an98' }, en: { ...t, slug: 'temp-an98' } },
        images: [{ id: imageId, colorHex: '#AABBCC', altEs: alt, altEn: alt }],
      });
      try {
        await auth(request(app.getHttpServer()).post(`/v1/admin/products/${temp.id}/images`)).send({ r2Key: 'products/otro/x.webp', width: 1, height: 1 }).expect(400);
        const added = (await auth(request(app.getHttpServer()).post(`/v1/admin/products/${temp.id}/images`)).send({ r2Key, width: 1200, height: 1500 }).expect(201)).body as AdminProduct;
        const img = added.images[0]!;
        expect(img).toMatchObject({ url: expect.stringContaining(r2Key), altEs: '', width: 1200 });

        // sin variante con precio no publica, y el alt escrito en ese PUT no queda guardado
        await put(temp.id, body('PUBLISHED', 'Vista frontal', img.id)).expect(422);
        expect((await detail(temp.id)).images[0]).toMatchObject({ altEs: '', colorHex: null });
        const saved = (await put(temp.id, body('DRAFT', 'Vista frontal', img.id)).expect(200)).body as AdminProduct;
        expect(saved.images[0]).toMatchObject({ altEs: 'Vista frontal', altEn: 'Vista frontal', colorHex: '#AABBCC' });

        const del = await auth(request(app.getHttpServer()).delete(`/v1/admin/products/${temp.id}/images/${img.id}`)).expect(200);
        expect(del.body).toEqual({ r2Key });
        expect((await detail(temp.id)).images).toEqual([]);
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
