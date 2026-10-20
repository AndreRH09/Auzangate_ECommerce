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
    expect(page2).toMatchObject({ page: 2, pageSize: 10 });
    expect(page2.items).toHaveLength(3);
    expect((await list('&page=3')).items).toEqual([]);
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
    const noSlug = ({ es, en }: AdminProduct['translations']) => {
      const strip = ({ name, subtitle, description, techSpecs }: AdminProduct['translations']['es']) => ({ name, subtitle, description, techSpecs });
      return { es: strip(es), en: strip(en) };
    };
    const toInput = ({ code, status, gender, categoryId, seriesId, translations }: AdminProduct) =>
      ({ code, status, gender, categoryId, seriesId, translations: noSlug(translations) }) satisfies AdminProductInput;
    afterAll(async () => {
      await put(original.id, toInput(original)).expect(200);
    });

    const input = (patch: (p: AdminProduct) => void) => {
      const p = structuredClone(original);
      patch(p);
      return toInput(p);
    };

    it('guarda, deriva el slug del nombre de cada idioma y la tienda lo refleja', async () => {
      const { body } = await put(original.id, input((p) => {
        p.translations.es.subtitle = 'Merino editado';
        p.translations.en.name = 'Base Layer AC03 Pro';
        p.translations.es.techSpecs = { peso: '150 g' };
      })).expect(200);
      expect(body.translations.es).toMatchObject({ slug: 'primera-capa-ac03', subtitle: 'Merino editado', techSpecs: { peso: '150 g' } });
      expect(body.translations.en.slug).toBe('base-layer-ac03-pro');
      const shop = await request(app.getHttpServer()).get('/v1/products/primera-capa-ac03?locale=es').expect(200);
      expect(shop.body.subtitle).toBe('Merino editado');
      // el slug ya no se manda: un campo de más es 400
      await put(original.id, { ...input(() => {}), translations: original.translations }).expect(400);
    });

    it('alta en borrador, variantes (crear, editar, quitar) y baja', async () => {
      const auth = (r: request.Test) => r.set('authorization', `Bearer ${token}`);
      const create = { code: 'AN96', gender: 'UNISEX', categoryId: original.categoryId, seriesId: null, names: { es: 'Temporal AN96', en: 'Temp AN96' } };
      const created = (await auth(request(app.getHttpServer()).post('/v1/admin/products')).send(create).expect(201)).body as AdminProduct;
      try {
        expect(created).toMatchObject({ code: 'AN96', status: 'DRAFT', variants: [], translations: { es: { slug: 'temporal-an96' }, en: { slug: 'temp-an96' } } });
        expect((await auth(request(app.getHttpServer()).post('/v1/admin/products')).send(create).expect(409)).body.message).toEqual(['code_taken']);

        const t = { name: 'Temporal AN96', subtitle: '', description: '', techSpecs: {} };
        const base = { ...input(() => {}), code: 'AN96', status: 'DRAFT', translations: { es: t, en: { ...t, name: 'Temp AN96' } } };
        const black = { from: '#111111', hex: '#111111', nameEs: 'Negro', nameEn: 'Black' };
        const row = (size: string, extra: object = {}) => ({ colorHex: '#111111', size, sku: `AN96-N-${size}`, priceCents: 10_000, stock: 2, ...extra });

        const first = (await put(created.id, { ...base, colors: [black], variants: [row('S'), row('M')] }).expect(200)).body as AdminProduct;
        expect(first.variants.map((v) => [v.sku, v.priceCents, v.stock])).toEqual([['AN96-N-M', 10_000, 2], ['AN96-N-S', 10_000, 2]]);
        expect(first.colors).toEqual([{ hex: '#111111', nameEs: 'Negro', nameEn: 'Black', variants: 2 }]);

        // S se edita por id, M no viene (se borra), L es nueva; el nombre del color se conserva sin mandar colors
        const s = first.variants.find((v) => v.size === 'S')!;
        const second = (await put(created.id, { ...base, variants: [row('S', { id: s.id, priceCents: 12_500, stock: 7 }), row('L')] }).expect(200)).body as AdminProduct;
        expect(second.variants.map((v) => [v.sku, v.priceCents, v.stock])).toEqual([['AN96-N-L', 10_000, 2], ['AN96-N-S', 12_500, 7]]);
        expect(second.variants.find((v) => v.size === 'S')!.id).toBe(s.id);

        const code = async (body: object, status: number) => (await put(created.id, { ...base, ...body }).expect(status)).body.message;
        expect(await code({ variants: [row('S'), row('S', { sku: 'AN96-N-S2' })] }, 409)).toEqual(['size_taken']);
        expect(await code({ variants: [row('S'), row('M', { sku: 'AN96-N-S' })] }, 409)).toEqual(['sku_taken']);
        expect(await code({ variants: [row('S', { sku: original.variants[0]!.sku })] }, 409)).toEqual(['sku_taken']); // SKU de otro producto
        expect(await code({ variants: [row('S', { colorHex: '#222222' })] }, 400)).toEqual(['need_color_name']);
        await put(created.id, { ...base, variants: [row('S', { priceCents: 0 })] }).expect(400);
        expect((await detail(created.id)).variants).toHaveLength(2); // los rechazos no dejaron nada a medias

        expect((await auth(request(app.getHttpServer()).delete(`/v1/admin/products/${created.id}`)).expect(200)).body).toEqual({ r2Keys: [] });
        await auth(request(app.getHttpServer()).get(`/v1/admin/products/${created.id}`)).expect(404);
      } finally {
        await app.get(PrismaService).product.deleteMany({ where: { id: created.id } });
      }
    });

    it('código o nombre (slug) repetido: 409 con el código de error', async () => {
      expect((await put(original.id, input((p) => (p.code = 'AW01'))).expect(409)).body.message).toEqual(['code_taken']);
      expect((await put(original.id, input((p) => (p.translations.es.name = 'Casaca AW01'))).expect(409)).body.message).toEqual(['slug_taken']);
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
        const res = await put(temp.id, { ...input(() => {}), code: 'AN99', status: 'PUBLISHED', translations: { es: t, en: { ...t, name: 'Temp AN99' } } }).expect(422);
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
        translations: { es: t, en: { ...t, name: 'Temp AN98' } },
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

    it('borrar color: sus variantes y fotos (también las sin color guardado), el resto queda', async () => {
      const prisma = app.get(PrismaService);
      const t = { name: 'Temporal AN97', subtitle: '', description: '', techSpecs: {} };
      const variant = (hex: string, size: string) => ({ sku: `AN97-${hex.slice(1)}-${size}`, colorHex: hex, colorName: { es: hex, en: hex }, size, priceCents: 100 });
      const image = (colorHex: string | null, n: number) => ({ r2Key: `products/x/${n}.webp`, colorHex, altEs: '', altEn: '', width: 1, height: 1 });
      const temp = await prisma.product.create({
        data: {
          code: 'AN97',
          categoryId: original.categoryId,
          translations: { create: [{ locale: 'es', slug: 'temporal-an97', ...t }, { locale: 'en', slug: 'temp-an97', ...t }] },
          variants: { create: [variant('#111111', 'S'), variant('#111111', 'M'), variant('#222222', 'S')] },
          images: { create: [image('#111111', 1), image(null, 2), image('#222222', 3)] },
        },
        include: { images: true },
      });
      const del = (body: object) =>
        request(app.getHttpServer()).delete(`/v1/admin/products/${temp.id}/colors`).set('authorization', `Bearer ${token}`).send(body);
      try {
        const unsaved = temp.images.find((i) => !i.colorHex)!; // subida al grupo del color pero aún sin guardar
        const { body } = await del({ hex: '#111111', imageIds: [unsaved.id] }).expect(200);
        expect(body.r2Keys.sort()).toEqual(['products/x/1.webp', 'products/x/2.webp']);
        const left = await detail(temp.id);
        expect(left.colors.map((c) => [c.hex, c.variants])).toEqual([['#222222', 1]]);
        expect(left.images.map((i) => i.colorHex)).toEqual(['#222222']);
        await del({ hex: 'rojo', imageIds: [] }).expect(400);
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
