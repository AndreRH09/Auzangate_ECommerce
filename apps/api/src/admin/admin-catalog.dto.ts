import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { LocaleQuery } from '../catalog/catalog.dto.js';
import { Gender, ProductStatus } from '../generated/prisma/enums.js';

export const ADMIN_SORTS = ['updated', 'code'] as const;

export class AdminProductsQuery extends LocaleQuery {
  /** código (AW01) o nombre en cualquier idioma */
  @IsOptional() @IsString() @MaxLength(80)
  q?: string;

  @IsOptional() @IsIn(Object.values(ProductStatus))
  status?: ProductStatus;

  /** valor exacto (a diferencia de la tienda, UNISEX no se suma a MEN/WOMEN) */
  @IsOptional() @IsIn(Object.values(Gender))
  gender?: Gender;

  /** slug de categoría; una categoría padre incluye a sus hijas */
  @IsOptional() @IsString() @MaxLength(80)
  category?: string;

  /** slug de serie */
  @IsOptional() @IsString() @MaxLength(80)
  series?: string;

  @IsIn(ADMIN_SORTS)
  sort: (typeof ADMIN_SORTS)[number] = 'updated';

  @Type(() => Number) @IsInt() @Min(1)
  page = 1;
}
