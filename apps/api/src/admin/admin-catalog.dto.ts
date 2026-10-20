import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsIn, IsInt, IsObject, IsOptional, IsString, Length, Matches, Max, MaxLength, Min, ValidateNested } from 'class-validator';
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

class ImageEditDto {
  @IsString() @MaxLength(30)
  id: string;

  /** null = la foto sirve para todos los colores */
  @IsOptional() @Matches(/^#[0-9a-f]{6}$/i)
  colorHex: string | null;

  @IsString() @MaxLength(200)
  altEs: string;

  @IsString() @MaxLength(200)
  altEn: string;
}

class ColorEditDto {
  /** hex actual de las variantes */
  @Matches(/^#[0-9a-f]{6}$/i)
  from: string;

  @Matches(/^#[0-9a-f]{6}$/i)
  hex: string;

  @IsString() @Length(1, 40)
  nameEs: string;

  @IsString() @Length(1, 40)
  nameEn: string;
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

  /** orden = orden de la galería; las fotos que no vengan no se tocan */
  @IsOptional() @IsArray() @ArrayMaxSize(50) @ValidateNested({ each: true }) @Type(() => ImageEditDto)
  images?: ImageEditDto[];

  @IsOptional() @IsArray() @ArrayMaxSize(20) @ValidateNested({ each: true }) @Type(() => ColorEditDto)
  colors?: ColorEditDto[];
}

// F1·5: la web lo registra después de subir el archivo a R2 (prefijo products/{productId}/).
export class AddImageDto {
  @Matches(/^products\/[a-z0-9]+\/[a-f0-9-]{36}\.(jpg|png|webp|avif)$/)
  r2Key: string;

  @IsInt() @Min(1) @Max(10000)
  width: number;

  @IsInt() @Min(1) @Max(10000)
  height: number;
}
