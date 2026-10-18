import { Type } from 'class-transformer';
import { IsHexColor, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Locale } from '../generated/prisma/enums.js';

export class LocaleQuery {
  @IsIn(Object.values(Locale))
  locale: Locale = Locale.es;
}

export const SORTS = ['new', 'price_asc', 'price_desc'] as const;
export type Sort = (typeof SORTS)[number];

export class ProductsQuery extends LocaleQuery {
  /** slug de categoría; una categoría padre incluye a sus hijas */
  @IsOptional() @IsString() @MaxLength(80)
  category?: string;

  /** slug de serie */
  @IsOptional() @IsString() @MaxLength(80)
  series?: string;

  /** búsqueda por texto en nombre, subtítulo y descripción del idioma activo */
  @IsOptional() @IsString() @MaxLength(80)
  q?: string;

  @IsOptional() @IsString() @MaxLength(8)
  size?: string;

  /** color en hex, ej. #262527 */
  @IsOptional() @IsHexColor()
  color?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  minPrice?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  maxPrice?: number;

  @IsIn(SORTS)
  sort: Sort = 'new';

  /** cursor opaco devuelto como nextCursor */
  @IsOptional() @IsString() @MaxLength(32)
  cursor?: string;

  @Type(() => Number) @IsInt() @Min(1) @Max(48)
  limit = 24;
}
