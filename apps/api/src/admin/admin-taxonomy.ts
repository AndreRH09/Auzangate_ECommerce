import { BadRequestException, Body, ConflictException, Controller, Delete, Get, Injectable, Module, NotFoundException, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../auth/admin.guard.js';
import type { AdminCategory, AdminSaveError, AdminSeries, Locale } from '../contract.js';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { slugify } from '../slugify.js';
import { SaveCategoryDto, SaveSeriesDto } from './admin-catalog.dto.js';

const LOCALES = ['es', 'en'] as const satisfies Locale[];
const fail = (Err: typeof ConflictException, code: AdminSaveError) => new Err({ message: [code] });
const byLocale = <R extends { locale: Locale }, T>(rows: R[], pick: (row: R | undefined) => T) =>
  Object.fromEntries(LOCALES.map((l) => [l, pick(rows.find((r) => r.locale === l))])) as Record<Locale, T>;

// RF-A06. Categorías: CRUD en árbol de 2 niveles. Series: solo edición (las 5 de marca son fijas).
@Injectable()
class AdminTaxonomyService {
  constructor(private readonly prisma: PrismaService) {}

  async categories(): Promise<AdminCategory[]> {
    const rows = await this.prisma.category.findMany({
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
      include: { translations: true, _count: { select: { products: true, children: true } } },
    });
    return rows.map((c) => ({
      id: c.id,
      parentId: c.parentId,
      sort: c.sort,
      names: byLocale(c.translations, (t) => t?.name ?? ''),
      slugs: byLocale(c.translations, (t) => t?.slug ?? ''),
      products: c._count.products,
      children: c._count.children,
    }));
  }

  /** id null = nueva */
  async saveCategory(id: string | null, { parentId, sort, names }: SaveCategoryDto): Promise<AdminCategory[]> {
    if (parentId) {
      // solo 2 niveles: el padre tiene que ser principal, y una categoría con hijas no puede colgar de otra
      const parent = await this.prisma.category.findUnique({ where: { id: parentId }, select: { parentId: true } });
      if (!parent) throw fail(BadRequestException, 'invalid_category');
      const hasChildren = id ? await this.prisma.category.count({ where: { parentId: id } }) : 0;
      if (parent.parentId || parentId === id || hasChildren) throw fail(BadRequestException, 'category_depth');
    }
    const translation = (locale: Locale) => ({ name: names[locale].trim(), slug: slugify(names[locale]) });
    try {
      if (id) {
        await this.prisma.category.update({
          where: { id },
          data: {
            parentId: parentId ?? null,
            sort,
            translations: {
              upsert: LOCALES.map((locale) => ({ where: { categoryId_locale: { categoryId: id, locale } }, create: { locale, ...translation(locale) }, update: translation(locale) })),
            },
          },
        });
      } else {
        await this.prisma.category.create({ data: { parentId: parentId ?? null, sort, translations: { create: LOCALES.map((locale) => ({ locale, ...translation(locale) })) } } });
      }
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025') throw new NotFoundException();
        if (e.code === 'P2002') throw fail(ConflictException, 'slug_taken');
      }
      throw e;
    }
    return this.categories();
  }

  // Solo vacía: con productos o subcategorías, primero hay que moverlos.
  async deleteCategory(id: string): Promise<AdminCategory[]> {
    const c = await this.prisma.category.findUnique({ where: { id }, select: { _count: { select: { products: true, children: true } } } });
    if (!c) throw new NotFoundException();
    if (c._count.products || c._count.children) throw fail(ConflictException, 'category_in_use');
    await this.prisma.category.delete({ where: { id } });
    return this.categories();
  }

  async series(): Promise<AdminSeries[]> {
    const rows = await this.prisma.series.findMany({ orderBy: { sort: 'asc' }, include: { translations: true, _count: { select: { products: true } } } });
    return rows.map((s) => ({
      id: s.id,
      code: s.code,
      sort: s.sort,
      translations: byLocale(s.translations, (t) => ({
        name: t?.name ?? '',
        slug: t?.slug ?? '',
        description: t?.description ?? '',
      })),
      products: s._count.products,
    }));
  }

  async saveSeries(id: string, { sort, translations }: SaveSeriesDto): Promise<AdminSeries[]> {
    const translation = (locale: Locale) => ({ name: translations[locale].name.trim(), slug: slugify(translations[locale].name), description: translations[locale].description.trim() });
    try {
      await this.prisma.series.update({
        where: { id },
        data: {
          sort,
          translations: {
            upsert: LOCALES.map((locale) => ({ where: { seriesId_locale: { seriesId: id, locale } }, create: { locale, ...translation(locale) }, update: translation(locale) })),
          },
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025') throw new NotFoundException();
        if (e.code === 'P2002') throw fail(ConflictException, 'slug_taken');
      }
      throw e;
    }
    return this.series();
  }
}

// Todas las escrituras devuelven la lista completa: la web la vuelve a pintar sin otro fetch.
@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('admin')
class AdminTaxonomyController {
  constructor(private readonly taxonomy: AdminTaxonomyService) {}

  @Get('categories')
  categories() {
    return this.taxonomy.categories();
  }

  /** 409 slug_taken · 400 invalid_category | category_depth */
  @Post('categories')
  createCategory(@Body() dto: SaveCategoryDto) {
    return this.taxonomy.saveCategory(null, dto);
  }

  @Put('categories/:id')
  updateCategory(@Param('id') id: string, @Body() dto: SaveCategoryDto) {
    return this.taxonomy.saveCategory(id, dto);
  }

  /** 409 category_in_use si tiene productos o subcategorías */
  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string) {
    return this.taxonomy.deleteCategory(id);
  }

  @Get('series')
  series() {
    return this.taxonomy.series();
  }

  /** 409 slug_taken */
  @Put('series/:id')
  updateSeries(@Param('id') id: string, @Body() dto: SaveSeriesDto) {
    return this.taxonomy.saveSeries(id, dto);
  }
}

@Module({ controllers: [AdminTaxonomyController], providers: [AdminTaxonomyService, AdminGuard] })
export class AdminTaxonomyModule {}
