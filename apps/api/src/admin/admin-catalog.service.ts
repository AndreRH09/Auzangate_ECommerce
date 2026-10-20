import { BadRequestException, ConflictException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { toImageUrl } from '../catalog/catalog.service.js';
import type { Env } from '../config/env.js';
import type { AdminCatalogOptions, AdminProduct, AdminProductList, AdminSaveError, Locale } from '../contract.js';
import { Prisma, ProductStatus } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { slugify } from '../slugify.js';
import type { AddImageDto, AdminProductsQuery, CreateProductDto, DeleteColorDto, SaveProductDto } from './admin-catalog.dto.js';

const PAGE_SIZE = 10;
const LOCALES = ['es', 'en'] as const satisfies Locale[];

// El cuerpo de los 409/422: { message: [códigos] }, igual que los 400 de validación.
const fail = (Err: typeof ConflictException, ...codes: AdminSaveError[]) => new Err({ message: codes });

// techSpecs llega como JSON libre: máx. 30 pares de texto corto.
const validSpecs = (specs: Record<string, unknown>) =>
  Object.keys(specs).length <= 30 &&
  Object.entries(specs).every(([k, v]) => k.trim() && k.length <= 40 && typeof v === 'string' && v.length <= 200);

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

  // Selects del formulario: categorías hijas como "Padre · Hija".
  async options(locale: Locale): Promise<AdminCatalogOptions> {
    const name = { where: { locale }, select: { name: true } };
    const [categories, series] = await Promise.all([
      this.prisma.category.findMany({ orderBy: [{ parentId: 'asc' }, { sort: 'asc' }], include: { translations: name, parent: { include: { translations: name } } } }),
      this.prisma.series.findMany({ orderBy: { sort: 'asc' }, include: { translations: name } }),
    ]);
    return {
      categories: categories.map((c) => ({
        id: c.id,
        name: [c.parent?.translations[0]?.name, c.translations[0]?.name].filter(Boolean).join(' · '),
      })),
      series: series.map((s) => ({ id: s.id, name: s.translations[0]?.name ?? s.code })),
    };
  }

  async product(id: string): Promise<AdminProduct> {
    const p = await this.prisma.product.findUnique({
      where: { id },
      include: { translations: true, images: { orderBy: { sort: 'asc' } }, variants: { orderBy: { sku: 'asc' } } },
    });
    if (!p) throw new NotFoundException();
    const empty = { name: '', slug: '', subtitle: '', description: '', techSpecs: {} };
    const t = (locale: Locale) => {
      const row = p.translations.find((r) => r.locale === locale);
      return row ? { name: row.name, slug: row.slug, subtitle: row.subtitle, description: row.description, techSpecs: row.techSpecs as Record<string, string> } : empty;
    };
    return {
      id: p.id,
      code: p.code,
      status: p.status,
      gender: p.gender,
      categoryId: p.categoryId,
      seriesId: p.seriesId,
      translations: { es: t('es'), en: t('en') },
      variants: p.variants.map(({ id, colorHex, size, sku, priceCents, stock }) => ({ id, colorHex, size, sku, priceCents, stock })),
      images: p.images.map((i) => ({ id: i.id, url: toImageUrl(i.r2Key, this.imageBase), colorHex: i.colorHex, altEs: i.altEs, altEn: i.altEn, width: i.width, height: i.height })),
      // un color por hex (las tallas lo repiten)
      colors: [...new Map(p.variants.map((v) => [v.colorHex, v.colorName as Record<Locale, string>])).entries()].map(([hex, n]) => ({
        hex,
        nameEs: n.es,
        nameEn: n.en,
        variants: p.variants.filter((v) => v.colorHex === hex).length,
      })),
      updatedAt: p.updatedAt.toISOString(),
    };
  }

  // RF-A02 (alta): borrador con nombre ES/EN; ficha, variantes y fotos se completan editando.
  async create({ code, gender, categoryId, seriesId, names }: CreateProductDto): Promise<AdminProduct> {
    const translation = (locale: Locale) => ({ locale, name: names[locale].trim(), slug: slugify(names[locale]), subtitle: '', description: '', techSpecs: {} });
    try {
      const { id } = await this.prisma.product.create({
        data: { code, gender, categoryId, seriesId: seriesId ?? null, translations: { create: LOCALES.map(translation) } },
      });
      return this.product(id);
    } catch (e) {
      throw this.saveError(e);
    }
  }

  /** borra el producto con sus variantes y fotos → claves de R2 para que la web limpie el bucket */
  async remove(id: string): Promise<{ r2Keys: string[] }> {
    const images = await this.prisma.productImage.findMany({ where: { productId: id }, select: { r2Key: true } });
    try {
      await this.prisma.product.delete({ where: { id } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025') throw new NotFoundException();
        // P2003: alguna variante ya está en una orden (OrderItem no borra en cascada); se archiva en su lugar
        if (e.code === 'P2003') throw fail(ConflictException, 'product_in_use');
      }
      throw e;
    }
    return { r2Keys: images.map((i) => i.r2Key) };
  }

  // F1·5. El archivo ya está en R2 (lo sube la web); aquí solo se registra al final de la galería, sin alt.
  async addImage(id: string, { r2Key, width, height }: AddImageDto): Promise<AdminProduct> {
    if (!r2Key.startsWith(`products/${id}/`)) throw new BadRequestException();
    const last = await this.prisma.productImage.findFirst({ where: { productId: id }, orderBy: { sort: 'desc' }, select: { sort: true } });
    try {
      await this.prisma.productImage.create({ data: { productId: id, r2Key, width, height, altEs: '', altEn: '', sort: (last?.sort ?? -1) + 1 } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') throw new NotFoundException();
      throw e;
    }
    return this.product(id);
  }

  /** borra las variantes del color y sus fotos en una transacción; devuelve las claves para que la web limpie R2 */
  async deleteColor(id: string, { hex, imageIds }: DeleteColorDto): Promise<{ r2Keys: string[] }> {
    if (!(await this.prisma.product.count({ where: { id } }))) throw new NotFoundException();
    const colorHex = hex?.toUpperCase();
    const images = { productId: id, OR: [{ id: { in: imageIds } }, ...(colorHex ? [{ colorHex }] : [])] };
    try {
      return await this.prisma.$transaction(async (tx) => {
        const rows = await tx.productImage.findMany({ where: images, select: { r2Key: true } });
        await tx.productImage.deleteMany({ where: images });
        if (colorHex) await tx.productVariant.deleteMany({ where: { productId: id, colorHex } });
        return { r2Keys: rows.map((r) => r.r2Key) };
      });
    } catch (e) {
      // P2003: alguna variante ya está en una orden (OrderItem no borra en cascada)
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') throw fail(ConflictException, 'color_in_use');
      throw e;
    }
  }

  /** devuelve la clave para que la web borre el archivo de R2 */
  async deleteImage(id: string, imageId: string): Promise<{ r2Key: string }> {
    const img = await this.prisma.productImage.findFirst({ where: { id: imageId, productId: id }, select: { r2Key: true } });
    if (!img) throw new NotFoundException();
    await this.prisma.productImage.delete({ where: { id: imageId } });
    return img;
  }

  // RF-A02/A03/A08. Reemplaza los datos editables, el alt/color/orden de las fotos y el hex/nombre de cada color de variantes.
  async update(id: string, dto: SaveProductDto): Promise<AdminProduct> {
    if (!(await this.prisma.product.count({ where: { id } }))) throw new NotFoundException();
    if (LOCALES.some((l) => !validSpecs(dto.translations[l].techSpecs))) throw fail(BadRequestException, 'invalid_tech_specs');
    const colors = (dto.colors ?? []).map((c) => ({ from: c.from.toUpperCase(), hex: c.hex.toUpperCase(), nameEs: c.nameEs, nameEn: c.nameEn }));
    if (new Set(colors.map((c) => c.hex)).size < colors.length) throw fail(ConflictException, 'color_taken');

    // slug siempre derivado del nombre de su idioma (no se edita a mano)
    const translation = (locale: Locale) => {
      const { name, subtitle, description, techSpecs } = dto.translations[locale];
      return { name: name.trim(), slug: slugify(name), subtitle, description, techSpecs };
    };
    // Una transacción: si la validación de publicación falla, tampoco quedan guardados los cambios de fotos.
    try {
      await this.prisma.$transaction(async (tx) => {
        // ponytail: cada color se mueve directo a su hex nuevo; intercambiar dos colores en un mismo guardado choca con el único (color_taken)
        for (const c of colors) {
          await tx.productVariant.updateMany({
            where: { productId: id, colorHex: c.from },
            data: { colorHex: c.hex, colorName: { es: c.nameEs.trim(), en: c.nameEn.trim() } },
          });
        }

        // RF-A04: la lista de variantes reemplaza a la guardada (borra las que falten, actualiza por id, crea las nuevas)
        if (dto.variants) {
          const rows = dto.variants.map(({ id, colorHex, size, sku, priceCents, stock }) => ({ id, colorHex: colorHex.toUpperCase(), size: size.trim(), sku, priceCents, stock }));
          if (new Set(rows.map((v) => `${v.colorHex}|${v.size}`)).size < rows.length) throw fail(ConflictException, 'size_taken');
          if (new Set(rows.map((v) => v.sku)).size < rows.length) throw fail(ConflictException, 'sku_taken');
          // nombre de cada color: el que llega en colors[] (incluye colores nuevos) o el ya guardado
          const saved = await tx.productVariant.findMany({ where: { productId: id }, select: { colorHex: true, colorName: true } });
          const names = new Map(saved.map((v) => [v.colorHex, v.colorName as Record<Locale, string>]));
          for (const c of colors) names.set(c.hex, { es: c.nameEs.trim(), en: c.nameEn.trim() });
          if (rows.some((v) => !names.has(v.colorHex))) throw fail(BadRequestException, 'need_color_name');

          await tx.productVariant.deleteMany({ where: { productId: id, id: { notIn: rows.flatMap((v) => (v.id ? [v.id] : [])) } } });
          for (const { id: variantId, ...v } of rows) {
            const data = { ...v, colorName: names.get(v.colorHex)! };
            if (variantId) await tx.productVariant.updateMany({ where: { id: variantId, productId: id }, data });
            else await tx.productVariant.create({ data: { ...data, productId: id } });
          }
        }

        // updateMany con productId: ignora ids ajenos o ya borrados. colorHex tal cual: la galería lo compara como texto con ProductVariant.colorHex
        for (const [sort, img] of (dto.images ?? []).entries()) {
          await tx.productImage.updateMany({
            where: { id: img.id, productId: id },
            data: { sort, colorHex: img.colorHex?.toUpperCase() ?? null, altEs: img.altEs.trim(), altEn: img.altEn.trim() },
          });
        }

        // RF-A08: no se publica sin ≥ 1 variante con precio ni ≥ 1 imagen con alt en ambos idiomas
        if (dto.status === ProductStatus.PUBLISHED) {
          const [priced, withAlt] = await Promise.all([
            tx.productVariant.count({ where: { productId: id, priceCents: { gt: 0 } } }),
            tx.productImage.count({ where: { productId: id, altEs: { not: '' }, altEn: { not: '' } } }),
          ]);
          const missing: AdminSaveError[] = [];
          if (!priced) missing.push('need_variant_price');
          if (!withAlt) missing.push('need_image_alt');
          if (missing.length) throw fail(UnprocessableEntityException, ...missing);
        }

        await tx.product.update({
          where: { id },
          data: {
            code: dto.code,
            status: dto.status,
            gender: dto.gender,
            categoryId: dto.categoryId,
            seriesId: dto.seriesId ?? null,
            translations: {
              upsert: LOCALES.map((locale) => ({
                where: { productId_locale: { productId: id, locale } },
                create: { locale, ...translation(locale) },
                update: translation(locale),
              })),
            },
          },
        });
      });
    } catch (e) {
      throw this.saveError(e);
    }
    return this.product(id);
  }

  // P2002 = único repetido (SKU, color, código o slug); P2003 = variante en órdenes o categoría/serie inexistente
  private saveError(e: unknown) {
    if (!(e instanceof Prisma.PrismaClientKnownRequestError)) return e;
    const meta = JSON.stringify(e.meta);
    if (e.code === 'P2002') {
      return fail(ConflictException, meta.includes('sku') ? 'sku_taken' : meta.includes('colorHex') ? 'color_taken' : meta.includes('code') ? 'code_taken' : 'slug_taken');
    }
    if (e.code === 'P2003') return meta.includes('variant') ? fail(ConflictException, 'variant_in_use') : fail(BadRequestException, 'invalid_category');
    return e;
  }
}
