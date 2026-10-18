// Catálogo: series, categorías y 20 productos ES/EN.
// Los precios, specs y stocks son DATOS DE EJEMPLO, no fichas reales.
import { ProductStatus, type Locale } from '../../src/generated/prisma/client.js';
import { prisma } from './client.js';

type T = Record<Locale, string>;
const LOCALES = ['es', 'en'] as const;

const SERIES: { code: string; name: T; description: T }[] = [
  { code: 'CARAL', name: { es: 'Caral', en: 'Caral' }, description: { es: 'Línea OG. La serie clásica y pionera.', en: 'OG line. The classic, original series.' } },
  { code: 'WARI', name: { es: 'Wari', en: 'Wari' }, description: { es: 'Expedición. Montañismo y outdoor exigente.', en: 'Expedition. Mountaineering and demanding outdoors.' } },
  { code: 'SICAN', name: { es: 'Sicán', en: 'Sicán' }, description: { es: 'Premium. Acabados, buen vestir y tendencias.', en: 'Premium. Finishes, tailoring and trends.' } },
  { code: 'VICUS', name: { es: 'Vicús', en: 'Vicús' }, description: { es: 'Equilibrio entre resistencia, acabados limpios y comodidad.', en: 'Balance of durability, clean finishes and comfort.' } },
  { code: 'NASCA', name: { es: 'Nasca', en: 'Nasca' }, description: { es: 'Ligera. Ropa liviana para climas cálidos.', en: 'Light. Lightweight gear for warm climates.' } },
];

// 3 padres; Hombre y Mujer con 3 hijas cada una.
const PARENTS = [
  { key: 'hombre', name: { es: 'Hombre', en: 'Men' }, slug: { es: 'hombre', en: 'men' } },
  { key: 'mujer', name: { es: 'Mujer', en: 'Women' }, slug: { es: 'mujer', en: 'women' } },
  { key: 'accesorios', name: { es: 'Accesorios', en: 'Accessories' }, slug: { es: 'accesorios', en: 'accessories' } },
] as const;

const CHILDREN = [
  { key: 'casacas', name: { es: 'Casacas', en: 'Jackets' }, slug: { es: 'casacas', en: 'jackets' } },
  { key: 'capas', name: { es: 'Capas', en: 'Layers' }, slug: { es: 'capas', en: 'layers' } },
  { key: 'pantalones', name: { es: 'Pantalones', en: 'Pants' }, slug: { es: 'pantalones', en: 'pants' } },
] as const;

type ChildKey = (typeof CHILDREN)[number]['key'];

const COLORS = [
  { hex: '#262527', name: { es: 'Granito', en: 'Granite' } },
  { hex: '#8A8D8F', name: { es: 'Roca', en: 'Rock' } },
  { hex: '#4B5D44', name: { es: 'Musgo', en: 'Moss' } },
  { hex: '#9C6B4E', name: { es: 'Arcilla', en: 'Clay' } },
];

// [modelo, tipo ES, tipo EN, categoría hija, serie, precio S/, subtítulo ES, subtítulo EN, specs]
type Line = [string, string, string, ChildKey, string, number, string, string, Record<string, string>];

const APPAREL: Line[] = [
  ['Kuntur', 'Casaca', 'Jacket', 'casacas', 'WARI', 489, 'Pluma 650 · -10 °C', '650 down · -10 °C', { peso: '420 g', relleno: 'Pluma 650 FP', temperatura: '-10 °C' }],
  ['Wayra', 'Cortavientos', 'Windbreaker', 'casacas', 'NASCA', 259, 'Ripstop 40D · 180 g', 'Ripstop 40D · 180 g', { peso: '180 g', tela: 'Nylon ripstop 40D' }],
  ['Rumi', 'Softshell', 'Softshell', 'casacas', 'VICUS', 389, 'Softshell 3 capas · DWR', '3-layer softshell · DWR', { peso: '390 g', acabado: 'DWR sin PFC' }],
  ['Illapa', 'Casaca impermeable', 'Rain jacket', 'casacas', 'WARI', 629, 'Membrana 20K · 3 capas', '20K membrane · 3 layers', { peso: '360 g', impermeabilidad: '20 000 mm', transpirabilidad: '20 000 g/m²' }],
  ['Qocha', 'Polar', 'Fleece', 'capas', 'CARAL', 219, 'Polar 300 g/m²', '300 g/m² fleece', { peso: '410 g', gramaje: '300 g/m²' }],
  ['Puna', 'Chaleco', 'Vest', 'capas', 'SICAN', 339, 'Pluma 800 · 210 g', '800 down · 210 g', { peso: '210 g', relleno: 'Pluma 800 FP' }],
  ['Sillar', 'Polo técnico', 'Tech tee', 'capas', 'NASCA', 119, 'Merino 150 g/m²', 'Merino 150 g/m²', { peso: '140 g', gramaje: '150 g/m²', fibra: 'Merino 87 %' }],
  ['Ichu', 'Pantalón', 'Pants', 'pantalones', 'VICUS', 279, 'Stretch 4 vías · UPF 50', '4-way stretch · UPF 50', { peso: '340 g', protección: 'UPF 50' }],
];

// [modelo, tipo ES, tipo EN, serie, precio S/, subtítulo ES, subtítulo EN, specs]
const ACCESSORIES: [string, string, string, string, number, string, string, Record<string, string>][] = [
  ['Nevado', 'Gorro', 'Beanie', 'CARAL', 79, 'Merino · talla única', 'Merino · one size', { fibra: 'Merino 100 %' }],
  ['Mitma', 'Guantes', 'Gloves', 'WARI', 129, 'Softshell · pantalla táctil', 'Softshell · touchscreen', { peso: '80 g' }],
  ['Chaski', 'Cuello', 'Neck gaiter', 'NASCA', 59, 'UPF 50 · 40 g', 'UPF 50 · 40 g', { peso: '40 g', protección: 'UPF 50' }],
  ['Apu', 'Primera capa', 'Base layer', 'CARAL', 169, 'Merino 200 g/m²', 'Merino 200 g/m²', { gramaje: '200 g/m²', fibra: 'Merino 100 %' }],
];

// Fotos reales servidas por la web desde public/Products (rutas que empiezan con "/" pasan tal cual).
const REAL_PHOTOS: Record<string, { key: string; width: number; height: number }[]> = {
  Nevado: [
    { key: '/Products/AC01Beanie/front.png', width: 1341, height: 988 },
    { key: '/Products/AC01Beanie/back.png', width: 1233, height: 934 },
    { key: '/Products/AC01Beanie/down.png', width: 1090, height: 829 },
  ],
};

const slugify =(s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// Stock determinista (sin Math.random) para que cada reset dé lo mismo; algunos en 0 para ver "Agotado".
const stockFor = (i: number) => [0, 2, 5, 8, 12, 3][i % 6]!;

async function seedSeries() {
  const ids = new Map<string, string>();
  for (const [sort, s] of SERIES.entries()) {
    const row = await prisma.series.create({
      data: {
        code: s.code,
        sort,
        translations: {
          create: LOCALES.map((locale) => ({
            locale,
            name: s.name[locale],
            slug: slugify(s.name[locale]),
            description: s.description[locale],
          })),
        },
      },
    });
    ids.set(s.code, row.id);
  }
  return ids;
}

async function seedCategories() {
  const ids = new Map<string, string>(); // "hombre/casacas" -> id
  for (const [sort, p] of PARENTS.entries()) {
    const parent = await prisma.category.create({
      data: {
        sort,
        translations: { create: LOCALES.map((locale) => ({ locale, name: p.name[locale], slug: p.slug[locale] })) },
      },
    });
    ids.set(p.key, parent.id);
    if (p.key === 'accesorios') continue;
    for (const [childSort, c] of CHILDREN.entries()) {
      const child = await prisma.category.create({
        data: {
          parentId: parent.id,
          sort: childSort,
          translations: {
            // slug único por idioma: "hombre-casacas" / "men-jackets"
            create: LOCALES.map((locale) => ({ locale, name: c.name[locale], slug: `${p.slug[locale]}-${c.slug[locale]}` })),
          },
        },
      });
      ids.set(`${p.key}/${c.key}`, child.id);
    }
  }
  return ids;
}

type ProductInput = {
  model: string; typeEs: string; typeEn: string; suffix?: T; categoryId: string; seriesId: string;
  seriesCode: string; price: number; subtitle: T; specs: Record<string, string>; sizes: string[];
};

async function createProduct(i: number, p: ProductInput) {
  const nameEs = `${p.typeEs} ${p.model}${p.suffix ? ` ${p.suffix.es}` : ''}`;
  const nameEn = `${p.model} ${p.typeEn}${p.suffix ? ` ${p.suffix.en}` : ''}`;
  const colors = COLORS.slice(0, 2 + (i % 3));
  const skuBase = `AUZ-${p.model.toUpperCase()}${p.suffix ? `-${p.suffix.es[0]!.toUpperCase()}` : ''}`;
  const techSpecs = { ...p.specs, serie: p.seriesCode };

  await prisma.product.create({
    data: {
      categoryId: p.categoryId,
      seriesId: p.seriesId,
      status: i === 7 ? ProductStatus.DRAFT : ProductStatus.PUBLISHED, // uno en borrador para probar el admin
      createdAt: new Date(Date.now() - i * 4 * 864e5), // escalonado: solo los ~8 primeros salen "NUEVO" (< 30 días)
      translations: {
        create: [
          { locale: 'es', name: nameEs, slug: slugify(nameEs), subtitle: p.subtitle.es, description: `${nameEs}. ${p.subtitle.es}.`, techSpecs },
          { locale: 'en', name: nameEn, slug: slugify(nameEn), subtitle: p.subtitle.en, description: `${nameEn}. ${p.subtitle.en}.`, techSpecs },
        ],
      },
      variants: {
        create: colors.flatMap((c, ci) =>
          p.sizes.map((size, si) => ({
            sku: `${skuBase}-${c.name.es.slice(0, 3).toUpperCase()}-${size}`,
            colorHex: c.hex,
            colorName: c.name,
            size,
            priceCents: p.price * 100,
            stock: stockFor(i + ci + si),
          })),
        ),
      },
      images: {
        // ponytail: fotos reales donde existen (apps/web/public/Products); el resto, placeholders MOCK de picsum.
        // Las fotos definitivas se suben a R2 desde el admin.
        create: (REAL_PHOTOS[p.model] ?? [0, 1, 2].map((n) => ({ key: `https://picsum.photos/seed/${skuBase}-${n}/1600/2000`, width: 1600, height: 2000 }))).map(
          (img, sort) => ({
            r2Key: img.key,
            altEs: `${nameEs}, vista ${sort + 1}`,
            altEn: `${nameEn}, view ${sort + 1}`,
            width: img.width,
            height: img.height,
            sort,
          }),
        ),
      },
    },
  });
}

export async function seedCatalog() {
  if ((await prisma.product.count()) > 0) {
    console.log('· catálogo ya existe, se omite (para re-sembrar: pnpm --filter api exec prisma migrate reset y luego pnpm db:seed)');
    return;
  }

  const series = await seedSeries();
  const categories = await seedCategories();

  const products: ProductInput[] = [];
  for (const gender of ['hombre', 'mujer'] as const) {
    for (const [model, typeEs, typeEn, child, seriesCode, price, subEs, subEn, specs] of APPAREL) {
      products.push({
        model, typeEs, typeEn, seriesCode, price, specs,
        seriesId: series.get(seriesCode)!,
        suffix: gender === 'hombre' ? { es: 'Hombre', en: 'Men' } : { es: 'Mujer', en: 'Women' },
        categoryId: categories.get(`${gender}/${child}`)!,
        subtitle: { es: subEs, en: subEn },
        sizes: gender === 'hombre' ? ['S', 'M', 'L', 'XL'] : ['XS', 'S', 'M', 'L'],
      });
    }
  }
  for (const [model, typeEs, typeEn, seriesCode, price, subEs, subEn, specs] of ACCESSORIES) {
    products.push({
      model, typeEs, typeEn, seriesCode, price, specs,
      seriesId: series.get(seriesCode)!,
      categoryId: categories.get('accesorios')!,
      subtitle: { es: subEs, en: subEn },
      sizes: ['U'],
    });
  }

  for (const [i, p] of products.entries()) await createProduct(i, p);
  console.log(`✓ ${SERIES.length} series, ${categories.size} categorías, ${products.length} productos`);
}
