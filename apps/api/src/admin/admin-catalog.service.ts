import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { toImageUrl } from '../catalog/catalog.service.js';
import type { Env } from '../config/env.js';
import type { AdminProductList } from '../contract.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AdminProductsQuery } from './admin-catalog.dto.js';

const PAGE_SIZE = 25;

@Injectable()
export class AdminCatalogService {
  private readonly imageBase: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.imageBase = config.get('IMAGE_BASE_URL', { infer: true });
  }

  // RF-A01. A diferencia de la tienda, ve todos los estados y pagina en SQL (skip/take).
  async products({ locale, q, status, gender, category, series, sort, page }: AdminProductsQuery): Promise<AdminProductList> {
    const bySlug = (slug: string) => ({ translations: { some: { locale, slug } } });
    const where: Prisma.ProductWhereInput = {
      ...(status && { status }),
      ...(gender && { gender }),
      ...(q && { OR: [{ code: { contains: q } }, { translations: { some: { name: { contains: q } } } }] }),
      ...(category && { category: { OR: [bySlug(category), { parent: bySlug(category) }] } }),
      ...(series && { series: bySlug(series) }),
    };
    const name = { where: { locale }, select: { name: true } };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        // id desempata: sin él, dos productos con el mismo updatedAt pueden repetirse entre páginas
        orderBy: sort === 'code' ? [{ code: 'asc' }] : [{ updatedAt: 'desc' }, { id: 'asc' }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: {
          translations: name,
          category: { include: { translations: name } },
          series: { select: { code: true } },
          variants: { select: { priceCents: true, stock: true } },
          images: { orderBy: { sort: 'asc' }, take: 1, select: { r2Key: true } },
        },
      }),
    ]);

    return {
      total,
      page,
      pageSize: PAGE_SIZE,
      items: rows.map((p) => ({
        id: p.id,
        code: p.code,
        name: p.translations[0]?.name ?? p.code,
        status: p.status,
        gender: p.gender,
        category: p.category.translations[0]?.name ?? '',
        series: p.series?.code ?? null,
        variants: p.variants.length,
        stock: p.variants.reduce((sum, v) => sum + v.stock, 0),
        priceFromCents: p.variants.length ? Math.min(...p.variants.map((v) => v.priceCents)) : null,
        imageUrl: p.images[0] ? toImageUrl(p.images[0].r2Key, this.imageBase) : null,
        updatedAt: p.updatedAt.toISOString(),
      })),
    };
  }
}
