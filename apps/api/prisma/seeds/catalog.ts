// Catálogo: series, categorías y 13 productos ES/EN, todos unisex.
// Los precios, specs y stocks son DATOS DE EJEMPLO, no fichas reales.
import { ProductStatus, type Locale } from '../../src/generated/prisma/client.js';
import { slugify } from '../../src/slugify.js';
import { prisma } from './client.js';

type T = Record<Locale, string>;
const LOCALES = ['es', 'en'] as const;

// La primera frase de la descripción es el nombre de la línea (la tienda la muestra como etiqueta).
const SERIES: { code: string; name: T; description: T }[] = [
  { code: 'CARAL', name: { es: 'Caral', en: 'Caral' }, description: { es: 'Classic. La serie clásica y pionera.', en: 'Classic. The classic, original series.' } },
  { code: 'WARI', name: { es: 'Wari', en: 'Wari' }, description: { es: 'Expedición. Montañismo y outdoor exigente.', en: 'Expedition. Mountaineering and demanding outdoors.' } },
  { code: 'SICAN', name: { es: 'Sicán', en: 'Sicán' }, description: { es: 'Selecto. Acabados, buen vestir y tendencias.', en: 'Selecto. Finishes, tailoring and trends.' } },
  { code: 'VICUS', name: { es: 'Vicús', en: 'Vicús' }, description: { es: 'Balance. Resistencia, acabados limpios y comodidad.', en: 'Balance. Durability, clean finishes and comfort.' } },
  { code: 'NASCA', name: { es: 'Nasca', en: 'Nasca' }, description: { es: 'Light. Ropa liviana para climas cálidos.', en: 'Light. Lightweight gear for warm climates.' } },
];

// Categorías por tipo de prenda, sin nivel Hombre/Mujer: el género es un atributo del producto
// (la mayoría unisex) y en la tienda es un filtro. El árbol de 2 niveles sigue disponible en el schema.
const CATEGORIES = [
  { key: 'casacas', name: { es: 'Casacas', en: 'Jackets' }, slug: { es: 'casacas', en: 'jackets' } },
  { key: 'capas', name: { es: 'Capas', en: 'Layers' }, slug: { es: 'capas', en: 'layers' } },
  { key: 'pantalones', name: { es: 'Pantalones', en: 'Pants' }, slug: { es: 'pantalones', en: 'pants' } },
  { key: 'accesorios', name: { es: 'Accesorios', en: 'Accessories' }, slug: { es: 'accesorios', en: 'accessories' } },
] as const;

type CategoryKey = (typeof CATEGORIES)[number]['key'];

// Código de color: 1 letra, usada en el SKU (AC04-C-M) y en la carpeta de fotos (products/AC04/C/front.png).
// Nunca "F": ese prefijo marca un corte de mujer en el código de producto.
const COLORS = [
  { code: 'C', hex: '#242428', name: { es: 'Carbón', en: 'Charcoal' } },
  { code: 'R', hex: '#8A8D8F', name: { es: 'Roca', en: 'Rock' } },
  { code: 'V', hex: '#4B5D44', name: { es: 'Musgo', en: 'Moss' } },
  { code: 'A', hex: '#9C6B4E', name: { es: 'Arcilla', en: 'Clay' } },
];

// Convención de nombres: "{Tipo} {código}", sin nombre de modelo ni adjetivos.
// Código = A (Auzangate) + inicial de la serie (C/W/S/V/N) + número de 2 dígitos por serie.
// Las prendas son unisex por defecto. Un corte específico de mujer antepone F al código (FAW01) y lleva gender WOMEN.
// Fotos: products/{código}/{color}/{vista}.{ext}, mínimo 3 vistas por color: front, rear, side.

// [código, tipo ES, tipo EN, categoría, serie, precio S/, subtítulo ES, subtítulo EN, specs]
type Line = [string, string, string, CategoryKey, string, number, string, string, Record<string, string>];

const APPAREL: Line[] = [
  ['AW01', 'Casaca', 'Jacket', 'casacas', 'WARI', 489, 'Pluma 650 · -10 °C', '650 down · -10 °C', { peso: '420 g', relleno: 'Pluma 650 FP', temperatura: '-10 °C' }],
  ['AN01', 'Cortavientos', 'Windbreaker', 'casacas', 'NASCA', 259, 'Ripstop 40D · 180 g', 'Ripstop 40D · 180 g', { peso: '180 g', tela: 'Nylon ripstop 40D' }],
  ['AV01', 'Softshell', 'Softshell', 'casacas', 'VICUS', 389, 'Softshell 3 capas · DWR', '3-layer softshell · DWR', { peso: '390 g', acabado: 'DWR sin PFC' }],
  ['AW02', 'Casaca', 'Jacket', 'casacas', 'WARI', 629, 'Membrana 20K · 3 capas', '20K membrane · 3 layers', { peso: '360 g', impermeabilidad: '20 000 mm', transpirabilidad: '20 000 g/m²' }],
  ['AC02', 'Polar', 'Fleece', 'capas', 'CARAL', 219, 'Polar 300 g/m²', '300 g/m² fleece', { peso: '410 g', gramaje: '300 g/m²' }],
  ['AS01', 'Chaleco', 'Vest', 'capas', 'SICAN', 339, 'Pluma 800 · 210 g', '800 down · 210 g', { peso: '210 g', relleno: 'Pluma 800 FP' }],
  ['AN02', 'Polo', 'Tee', 'capas', 'NASCA', 119, 'Merino 150 g/m²', 'Merino 150 g/m²', { peso: '140 g', gramaje: '150 g/m²', fibra: 'Merino 87 %' }],
  ['AV02', 'Pantalón', 'Pants', 'pantalones', 'VICUS', 279, 'Stretch 4 vías · UPF 50', '4-way stretch · UPF 50', { peso: '340 g', protección: 'UPF 50' }],
  ['AC04', 'Polo', 'Tee', 'capas', 'CARAL', 99, 'Algodón 180 g/m²', 'Cotton 180 g/m²', { peso: '180 g', fibra: 'Algodón 100 %' }],
];

// [código, tipo ES, tipo EN, serie, precio S/, subtítulo ES, subtítulo EN, specs]
const ACCESSORIES: [string, string, string, string, number, string, string, Record<string, string>][] = [
  ['AC01', 'Gorro', 'Beanie', 'CARAL', 79, 'Merino · talla única', 'Merino · one size', { fibra: 'Merino 100 %' }],
  ['AW03', 'Guantes', 'Gloves', 'WARI', 129, 'Softshell · pantalla táctil', 'Softshell · touchscreen', { peso: '80 g' }],
  ['AN03', 'Cuello', 'Neck gaiter', 'NASCA', 59, 'UPF 50 · 40 g', 'UPF 50 · 40 g', { peso: '40 g', protección: 'UPF 50' }],
  ['AC03', 'Primera capa', 'Base layer', 'CARAL', 169, 'Merino 200 g/m²', 'Merino 200 g/m²', { gramaje: '200 g/m²', fibra: 'Merino 100 %' }],
];

// Fotos reales servidas por la web desde public/products (rutas que empiezan con "/" pasan tal cual).
// colorHex null = la foto sirve para todos los colores.
type Photo = { key: string; width: number; height: number; colorHex: string | null };
const VIEWS = ['front', 'rear', 'side'] as const;
const REAL_PHOTOS: Record<string, Photo[]> = {
  // ponytail: el gorro de las fotos no es de ningún color de la paleta; compartidas hasta tener fotos por color
  AC01: [
    { key: '/products/AC01/front.png', width: 1341, height: 988, colorHex: null },
    { key: '/products/AC01/rear.png', width: 1233, height: 934, colorHex: null },
    { key: '/products/AC01/side.png', width: 1090, height: 829, colorHex: null },
  ],
  AC04: COLORS.filter((c) => 'CRV'.includes(c.code)).flatMap((c) =>
    VIEWS.map((v) => ({ key: `/products/AC04/${c.code}/${v}.png`, width: 1024, height: 1024, colorHex: c.hex })), // cuadradas
  ),
};


// Stock determinista (sin Math.random) para que cada reset dé lo mismo; algunos en 0 para ver "Agotado".
const stockFor = (i: number) => [0, 2, 5, 8, 12, 3][i % 6]!;

// Upsert: re-ejecutar el seed actualiza nombres y descripciones de las series aunque el catálogo ya exista.
async function seedSeries() {
  const ids = new Map<string, string>();
  for (const [sort, s] of SERIES.entries()) {
    const row = await prisma.series.upsert({ where: { code: s.code }, create: { code: s.code, sort }, update: { sort } });
    for (const locale of LOCALES) {
      const data = { name: s.name[locale], slug: slugify(s.name[locale]), description: s.description[locale] };
      await prisma.seriesTranslation.upsert({
        where: { seriesId_locale: { seriesId: row.id, locale } },
        create: { seriesId: row.id, locale, ...data },
        update: data,
      });
    }
    ids.set(s.code, row.id);
  }
  return ids;
}

async function seedCategories() {
  const ids = new Map<string, string>(); // "casacas" -> id
  for (const [sort, c] of CATEGORIES.entries()) {
    const row = await prisma.category.create({
      data: { sort, translations: { create: LOCALES.map((locale) => ({ locale, name: c.name[locale], slug: c.slug[locale] })) } },
    });
    ids.set(c.key, row.id);
  }
  return ids;
}

type ProductInput = {
  code: string; typeEs: string; typeEn: string; categoryId: string; seriesId: string;
  seriesCode: string; price: number; subtitle: T; specs: Record<string, string>; sizes: string[];
};

async function createProduct(i: number, p: ProductInput) {
  const nameEs = `${p.typeEs} ${p.code}`;
  const nameEn = `${p.typeEn} ${p.code}`;
  // con fotos por color, solo los colores fotografiados; si no, 2-4 colores de ejemplo
  const photoHexes = new Set(REAL_PHOTOS[p.code]?.map((img) => img.colorHex).filter(Boolean));
  const colors = photoHexes.size ? COLORS.filter((c) => photoHexes.has(c.hex)) : COLORS.slice(0, 2 + (i % 3));
  const techSpecs = { ...p.specs, serie: p.seriesCode };

  await prisma.product.create({
    data: {
      code: p.code,
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
            sku: `${p.code}-${c.code}-${size}`, // AW01-C-M
            colorHex: c.hex,
            colorName: c.name,
            size,
            priceCents: p.price * 100,
            stock: stockFor(i + ci + si),
          })),
        ),
      },
      images: {
        // ponytail: fotos reales donde existen (apps/web/public/products); el resto, placeholders MOCK de picsum
        // (3 por color, para que la galería cambie al elegir color). Las definitivas se suben a R2 desde el admin.
        create: (
          REAL_PHOTOS[p.code] ??
          colors.flatMap((c): Photo[] => VIEWS.map((v) => ({ key: `https://picsum.photos/seed/${p.code}-${c.code}-${v}/1600/2000`, width: 1600, height: 2000, colorHex: c.hex })))
        ).map((img, sort) => ({
          r2Key: img.key,
          colorHex: img.colorHex,
          altEs: `${nameEs}, vista ${['frontal', 'posterior', 'lateral'][sort % 3]}`,
          altEn: `${nameEn}, ${VIEWS[sort % 3]} view`,
          width: img.width,
          height: img.height,
          sort,
        })),
      },
    },
  });
}

export async function seedCatalog() {
  const series = await seedSeries();
  if ((await prisma.product.count()) > 0) {
    console.log(`✓ ${SERIES.length} series actualizadas · productos ya existen, se omiten (para re-sembrar: prisma migrate reset y luego pnpm db:seed)`);
    return;
  }

  const categories = await seedCategories();

  // todos unisex (gender por defecto), tallas XS a XL
  const products: ProductInput[] = APPAREL.map(([code, typeEs, typeEn, category, seriesCode, price, subEs, subEn, specs]) => ({
    code, typeEs, typeEn, seriesCode, price, specs,
    seriesId: series.get(seriesCode)!,
    categoryId: categories.get(category)!,
    subtitle: { es: subEs, en: subEn },
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
  }));
  for (const [code, typeEs, typeEn, seriesCode, price, subEs, subEn, specs] of ACCESSORIES) {
    products.push({
      code, typeEs, typeEn, seriesCode, price, specs,
      seriesId: series.get(seriesCode)!,
      categoryId: categories.get('accesorios')!,
      subtitle: { es: subEs, en: subEn },
      sizes: ['U'],
    });
  }

  for (const [i, p] of products.entries()) await createProduct(i, p);
  console.log(`✓ ${SERIES.length} series, ${categories.size} categorías, ${products.length} productos`);
}
