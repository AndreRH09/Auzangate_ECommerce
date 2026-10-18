import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.js';
import { Gender, Prisma, ProductStatus, type Locale } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { Card, Category, Image, Named, Product, ProductList, Series, SitemapFeed } from '../contract.js';
import type { ProductsQuery } from './catalog.dto.js';

const NEW_DAYS = 30;

const translations = { select: { locale: true, name: true, slug: true } } as const;

const cardInclude = {
  translations: { select: { locale: true, name: true, slug: true, subtitle: true } },
  variants: { select: { colorHex: true, colorName: true, size: true, priceCents: true, stock: true } },
  images: { orderBy: { sort: 'asc' }, take: 2 },
} satisfies Prisma.ProductInclude;

type CardRow = Prisma.ProductGetPayload<{ include: typeof cardInclude }>;
type ImageRow = CardRow['images'][number];
type NamedRow = { locale: Locale; name: string; slug: string };

const pick = <T extends { locale: Locale }>(rows: T[], locale: Locale) => rows.find((r) => r.locale === locale)!;
const alternates = (rows: { locale: Locale; slug: string }[]) =>
  Object.fromEntries(rows.map((r) => [r.locale, r.slug])) as Record<Locale, string>;
const named = (rows: NamedRow[], locale: Locale): Named => ({ name: pick(rows, locale).name, slug: pick(rows, locale).slug, alternates: alternates(rows) });
const fromPrice = (p: CardRow) => Math.min(...p.variants.map((v) => v.priceCents)); // precio "desde"
// Claves de R2 -> URL pública. URLs absolutas o rutas del front ("/products/...") pasan tal cual.
export const toImageUrl = (key: string, base: string) => (/^(https?:)?\//.test(key) ? key : `${base}/${key}`);
const uniqueBy =<T>(rows: T[], key: (r: T) => string) => [...new Map(rows.map((r) => [key(r), r])).values()];

@Injectable()
export class CatalogService {
  private readonly imageBase: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.imageBase = config.get('IMAGE_BASE_URL', { infer: true });
  }

  private imageUrl(key: string) {
    return toImageUrl(key, this.imageBase);
  }

  private image(img: ImageRow, locale: Locale): Image {
    return { url: this.imageUrl(img.r2Key), alt: locale === 'es' ? img.altEs : img.altEn, width: img.width, height: img.height, colorHex: img.colorHex };
  }

  private card(p: CardRow, locale: Locale): Card {
    const t = pick(p.translations, locale);
    return {
      id: p.id,
      slug: t.slug,
      name: t.name,
      subtitle: t.subtitle,
      priceCents: fromPrice(p),
      colors: uniqueBy(p.variants, (v) => v.colorHex).map((v) => ({ hex: v.colorHex, name: (v.colorName as Record<Locale, string>)[locale] })),
      isNew: Date.now() - p.createdAt.getTime() < NEW_DAYS * 864e5,
      soldOut: p.variants.every((v) => v.stock <= 0),
      images: p.images.map((img) => this.image(img, locale)),
      alternates: alternates(p.translations),
    };
  }

  async categories(locale: Locale): Promise<Category[]> {
    const rows = await this.prisma.category.findMany({
      where: { parentId: null },
      orderBy: { sort: 'asc' },
      include: { translations, children: { orderBy: { sort: 'asc' }, include: { translations } } },
    });
    return rows.map((c) => ({ ...named(c.translations, locale), children: c.children.map((ch) => named(ch.translations, locale)) }));
  }

  async series(locale: Locale): Promise<Series[]> {
    const rows = await this.prisma.series.findMany({ orderBy: { sort: 'asc' }, include: { translations: true } });
    return rows.map((s) => ({ code: s.code, description: pick(s.translations, locale).description, ...named(s.translations, locale) }));
  }

  // ponytail: filtra, ordena y pagina en memoria (el precio "desde" es el mínimo de las variantes y
  // Prisma no ordena por agregados). Techo: unos miles de productos; luego pasar a SQL con un precio desnormalizado.
  async products(query: ProductsQuery): Promise<ProductList> {
    const { locale, category, series, gender, q, size, color, minPrice, maxPrice, sort, limit } = query;
    const bySlug = (slug: string) => ({ translations: { some: { locale, slug } } });

    const rows = await this.prisma.product.findMany({
      where: {
        status: ProductStatus.PUBLISHED,
        translations: {
          some: {
            locale,
            // ponytail: LIKE con collation _ai_ci (ignora tildes y mayúsculas). FULLTEXT si el catálogo crece.
            ...(q && { OR: [{ name: { contains: q } }, { subtitle: { contains: q } }, { description: { contains: q } }] }),
          },
        },
        ...(category && { category: { OR: [bySlug(category), { parent: bySlug(category) }] } }),
        ...(series && { series: bySlug(series) }),
        ...(gender && { gender: { in: [Gender.UNISEX, gender === 'men' ? Gender.MEN : Gender.WOMEN] } }),
      },
      include: cardInclude,
    });

    // facetas sobre el conjunto antes de los filtros de variante: el drawer muestra todas las opciones
    const variants = rows.flatMap((p) => p.variants);
    const prices = variants.map((v) => v.priceCents);
    const facets = {
      sizes: uniqueBy(variants, (v) => v.size).map((v) => v.size),
      colors: uniqueBy(variants, (v) => v.colorHex).map((v) => ({ hex: v.colorHex, name: (v.colorName as Record<Locale, string>)[locale] })),
      price: { min: prices.length ? Math.min(...prices) : 0, max: prices.length ? Math.max(...prices) : 0 },
    };

    const matches = (v: CardRow['variants'][number]) =>
      (!size || v.size === size) &&
      (!color || v.colorHex.toLowerCase() === color.toLowerCase()) &&
      (minPrice === undefined || v.priceCents >= minPrice) &&
      (maxPrice === undefined || v.priceCents <= maxPrice);

    const found = rows.filter((p) => p.variants.some(matches));
    found.sort((a, b) =>
      sort === 'price_asc' ? fromPrice(a) - fromPrice(b)
      : sort === 'price_desc' ? fromPrice(b) - fromPrice(a)
      : b.createdAt.getTime() - a.createdAt.getTime() || a.id.localeCompare(b.id),
    );

    const offset = Number.parseInt(query.cursor ?? '0', 10) || 0;
    return {
      total: found.length,
      items: found.slice(offset, offset + limit).map((p) => this.card(p, locale)),
      nextCursor: offset + limit < found.length ? String(offset + limit) : null,
      facets,
    };
  }

  async product(slug: string, locale: Locale): Promise<Product> {
    const p = await this.prisma.product.findFirst({
      where: { status: ProductStatus.PUBLISHED, translations: { some: { locale, slug } } },
      include: {
        translations: true,
        variants: { orderBy: [{ colorHex: 'asc' }, { size: 'asc' }] },
        images: { orderBy: { sort: 'asc' } },
        category: { include: { translations, parent: { include: { translations } } } },
        series: { include: { translations } },
      },
    });
    if (!p) throw new NotFoundException();

    const related = await this.prisma.product.findMany({
      where: {
        status: ProductStatus.PUBLISHED,
        id: { not: p.id },
        // "Combina con": misma serie o misma categoría ({ seriesId: undefined } matchearía todo)
        OR: p.seriesId ? [{ seriesId: p.seriesId }, { categoryId: p.categoryId }] : [{ categoryId: p.categoryId }],
      },
      include: cardInclude,
      take: 4,
    });

    const t = pick(p.translations, locale);
    return {
      id: p.id,
      code: p.code,
      gender: p.gender,
      slug: t.slug,
      name: t.name,
      subtitle: t.subtitle,
      description: t.description,
      techSpecs: t.techSpecs as Record<string, string>,
      updatedAt: p.updatedAt.toISOString(),
      alternates: alternates(p.translations),
      category: {
        ...named(p.category.translations, locale),
        parent: p.category.parent && named(p.category.parent.translations, locale),
      },
      series: p.series && { code: p.series.code, ...named(p.series.translations, locale) },
      variants: p.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        colorHex: v.colorHex,
        colorName: (v.colorName as Record<Locale, string>)[locale],
        size: v.size,
        priceCents: v.priceCents,
        stock: v.stock,
      })),
      images: p.images.map((img) => this.image(img, locale)),
      related: related.map((r) => this.card(r, locale)),
    };
  }

  // Feed liviano para sitemap.xml: los dos idiomas en una sola llamada (hreflang necesita ambos slugs).
  async sitemap(): Promise<SitemapFeed> {
    const [products, categories, series] = await Promise.all([
      this.prisma.product.findMany({
        where: { status: ProductStatus.PUBLISHED },
        select: { updatedAt: true, translations: { select: { locale: true, slug: true } }, images: { orderBy: { sort: 'asc' }, select: { r2Key: true } } },
      }),
      this.prisma.category.findMany({ select: { translations: { select: { locale: true, slug: true } } } }),
      this.prisma.series.findMany({ select: { translations: { select: { locale: true, slug: true } } } }),
    ]);
    return {
      products: products.map((p) => ({ updatedAt: p.updatedAt.toISOString(), slugs: alternates(p.translations), images: p.images.map((i) => this.imageUrl(i.r2Key)) })),
      categories: categories.map((c) => ({ slugs: alternates(c.translations) })),
      series: series.map((s) => ({ slugs: alternates(s.translations) })),
    };
  }
}
