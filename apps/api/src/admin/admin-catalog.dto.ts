import { Type } from 'class-transformer';
import { IsIn, IsInt, IsObject, IsOptional, IsString, Length, Matches, MaxLength, Min, ValidateNested } from 'class-validator';
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

class TranslationDto {
  @IsString() @Length(1, 120)
  name: string;

  /** vacío u omitido = se genera del nombre */
  @IsOptional() @Matches(/^([a-z0-9]+(-[a-z0-9]+)*)?$/, { message: 'slug: solo minúsculas, números y guiones' }) @MaxLength(140)
  slug?: string;

  @IsString() @MaxLength(160)
  subtitle: string;

  @IsString() @MaxLength(5000)
  description: string;

  /** pares clave/valor de texto; se validan en el service */
  @IsObject()
  techSpecs: Record<string, string>;
}

class TranslationsDto {
  @ValidateNested() @Type(() => TranslationDto)
  es: TranslationDto;

  @ValidateNested() @Type(() => TranslationDto)
  en: TranslationDto;
}

// RF-A02/A03: el formulario completo (PUT). Ambas traducciones son obligatorias.
export class SaveProductDto {
  /** convención: [F] A + inicial de serie + 2 dígitos (AW01, FAW01) */
  @Matches(/^F?A[CWSVN]\d{2}$/, { message: 'code: formato [F]A + serie (C/W/S/V/N) + 2 dígitos' })
  code: string;

  @IsIn(Object.values(ProductStatus))
  status: ProductStatus;

  @IsIn(Object.values(Gender))
  gender: Gender;

  @IsString() @MaxLength(30)
  categoryId: string;

  /** null = sin serie */
  @IsOptional() @IsString() @MaxLength(30)
  seriesId: string | null;

  @ValidateNested() @Type(() => TranslationsDto)
  translations: TranslationsDto;
}
