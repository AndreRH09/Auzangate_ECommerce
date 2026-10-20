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
  /** el slug se genera de aquí (slugify); debe dejar al menos una letra o número */
  @IsString() @Length(1, 120) @Matches(/[\p{L}\p{N}]/u)
  name: string;

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

// RF-A04: una fila de la matriz color × talla. Sin id = variante nueva.
class VariantDto {
  @IsOptional() @IsString() @MaxLength(30)
  id?: string;

  @Matches(/^#[0-9a-f]{6}$/i)
  colorHex: string;

  @IsString() @Length(1, 12)
  size: string;

  /** convención {código}-{color}-{talla}: AC04-C-M */
  @Matches(/^[A-Z0-9][A-Z0-9-]{2,39}$/, { message: 'sku: mayúsculas, números y guiones (3-40)' })
  sku: string;

  @IsInt() @Min(1) @Max(10_000_000)
  priceCents: number;

  @IsInt() @Min(0) @Max(100_000)
  stock: number;
}

/** convención: [F] A + inicial de serie + 2 dígitos (AW01, FAW01) */
const CODE = [/^F?A[CWSVN]\d{2}$/, { message: 'code: formato [F]A + serie (C/W/S/V/N) + 2 dígitos' }] as const;

// RF-A02/A03: el formulario completo (PUT). Ambas traducciones son obligatorias.
export class SaveProductDto {
  @Matches(...CODE)
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

  /** lista completa: las variantes guardadas que no vengan se borran */
  @IsOptional() @IsArray() @ArrayMaxSize(200) @ValidateNested({ each: true }) @Type(() => VariantDto)
  variants?: VariantDto[];
}

class NamesDto {
  @IsString() @Length(1, 120) @Matches(/[\p{L}\p{N}]/u)
  es: string;

  @IsString() @Length(1, 120) @Matches(/[\p{L}\p{N}]/u)
  en: string;
}

// RF-A02 (alta): lo mínimo para que exista; el resto se completa editando. Nace en borrador.
export class CreateProductDto {
  @Matches(...CODE)
  code: string;

  @IsIn(Object.values(Gender))
  gender: Gender;

  @IsString() @MaxLength(30)
  categoryId: string;

  @IsOptional() @IsString() @MaxLength(30)
  seriesId: string | null;

  @ValidateNested() @Type(() => NamesDto)
  names: NamesDto;
}

// RF-A06. parentId null = categoría principal.
export class SaveCategoryDto {
  @IsOptional() @IsString() @MaxLength(30)
  parentId: string | null;

  @IsInt() @Min(0) @Max(999)
  sort: number;

  @ValidateNested() @Type(() => NamesDto)
  names: NamesDto;
}

class SeriesTranslationDto {
  @IsString() @Length(1, 60) @Matches(/[\p{L}\p{N}]/u)
  name: string;

  /** la primera frase es el nombre de la línea ("Classic.") que muestra la tienda */
  @IsString() @Length(1, 1000)
  description: string;
}

class SeriesTranslationsDto {
  @ValidateNested() @Type(() => SeriesTranslationDto)
  es: SeriesTranslationDto;

  @ValidateNested() @Type(() => SeriesTranslationDto)
  en: SeriesTranslationDto;
}

export class SaveSeriesDto {
  @IsInt() @Min(0) @Max(999)
  sort: number;

  @ValidateNested() @Type(() => SeriesTranslationsDto)
  translations: SeriesTranslationsDto;
}

// Borrar un color: variantes con ese hex + fotos por id (las recién subidas aún no tienen color guardado).
export class DeleteColorDto {
  /** null = solo fotos (color sin variantes) */
  @IsOptional() @Matches(/^#[0-9a-f]{6}$/i)
  hex: string | null;

  @IsArray() @ArrayMaxSize(100) @IsString({ each: true }) @MaxLength(30, { each: true })
  imageIds: string[];
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
