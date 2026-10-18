import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LocaleQuery, ProductsQuery } from './catalog.dto.js';
import { CatalogService } from './catalog.service.js';

@ApiTags('catalog')
@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('categories')
  categories(@Query() { locale }: LocaleQuery) {
    return this.catalog.categories(locale);
  }

  @Get('series')
  series(@Query() { locale }: LocaleQuery) {
    return this.catalog.series(locale);
  }

  /** Listado (PLP) y búsqueda (`q`). Solo productos PUBLISHED. */
  @Get('products')
  products(@Query() query: ProductsQuery) {
    return this.catalog.products(query);
  }

  @Get('products/:slug')
  product(@Param('slug') slug: string, @Query() { locale }: LocaleQuery) {
    return this.catalog.product(slug, locale);
  }

  @Get('catalog/sitemap')
  sitemap() {
    return this.catalog.sitemap();
  }
}
