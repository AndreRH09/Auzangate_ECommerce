import { Controller, Get, Module, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../auth/admin.guard.js';
import { AdminProductsQuery } from './admin-catalog.dto.js';
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
}

@Module({ controllers: [AdminCatalogController], providers: [AdminCatalogService, AdminGuard] })
export class AdminCatalogModule {}
