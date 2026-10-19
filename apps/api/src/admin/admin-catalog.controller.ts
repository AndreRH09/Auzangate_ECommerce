import { Body, Controller, Get, Module, Param, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../auth/admin.guard.js';
import { LocaleQuery } from '../catalog/catalog.dto.js';
import { AdminProductsQuery, SaveProductDto } from './admin-catalog.dto.js';
import { AdminCatalogService } from './admin-catalog.service.js';

// Todo bajo /v1/admin exige sesión de admin.
@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('admin')
class AdminCatalogController {
  constructor(private readonly catalog: AdminCatalogService) {}

  @Get('products')
  products(@Query() query: AdminProductsQuery) {
    return this.catalog.products(query);
  }

  /** opciones de los selects del formulario (categorías y series con id) */
  @Get('catalog-options')
  options(@Query() { locale }: LocaleQuery) {
    return this.catalog.options(locale);
  }

  @Get('products/:id')
  product(@Param('id') id: string) {
    return this.catalog.product(id);
  }

  /** 409 { message: ['code_taken' | 'slug_taken'] } · 422 { message: ['need_variant_price', 'need_image_alt'] } */
  @Put('products/:id')
  update(@Param('id') id: string, @Body() dto: SaveProductDto) {
    return this.catalog.update(id, dto);
  }
}

@Module({ controllers: [AdminCatalogController], providers: [AdminCatalogService, AdminGuard] })
export class AdminCatalogModule {}
