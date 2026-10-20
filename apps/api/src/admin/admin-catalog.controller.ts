import { Body, Controller, Delete, Get, Module, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../auth/admin.guard.js';
import { LocaleQuery } from '../catalog/catalog.dto.js';
import { AddImageDto, AdminProductsQuery, CreateProductDto, DeleteColorDto, SaveProductDto } from './admin-catalog.dto.js';
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

  /** alta en borrador · 409 code_taken | slug_taken · 400 invalid_category */
  @Post('products')
  create(@Body() dto: CreateProductDto) {
    return this.catalog.create(dto);
  }

  @Get('products/:id')
  product(@Param('id') id: string) {
    return this.catalog.product(id);
  }

  /** → { r2Keys } para limpiar el bucket · 409 product_in_use si alguna variante está en órdenes */
  @Delete('products/:id')
  remove(@Param('id') id: string) {
    return this.catalog.remove(id);
  }

  /** 409 { message: ['code_taken' | 'slug_taken' | 'color_taken' | 'sku_taken' | 'size_taken' | 'variant_in_use'] } · 422 { message: ['need_variant_price', 'need_image_alt'] } */
  @Put('products/:id')
  update(@Param('id') id: string, @Body() dto: SaveProductDto) {
    return this.catalog.update(id, dto);
  }

  /** registra una foto ya subida a R2 por la web */
  @Post('products/:id/images')
  addImage(@Param('id') id: string, @Body() dto: AddImageDto) {
    return this.catalog.addImage(id, dto);
  }

  /** borra un color (variantes + fotos) → { r2Keys } para limpiar el bucket · 409 color_in_use si hay órdenes */
  @Delete('products/:id/colors')
  deleteColor(@Param('id') id: string, @Body() dto: DeleteColorDto) {
    return this.catalog.deleteColor(id, dto);
  }

  /** → { r2Key } para borrar el archivo del bucket */
  @Delete('products/:id/images/:imageId')
  deleteImage(@Param('id') id: string, @Param('imageId') imageId: string) {
    return this.catalog.deleteImage(id, imageId);
  }
}

@Module({ controllers: [AdminCatalogController], providers: [AdminCatalogService, AdminGuard] })
export class AdminCatalogModule {}
