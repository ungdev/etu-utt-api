import { Type } from 'class-transformer';
import { IsNumber, IsPositive, IsString, IsOptional } from 'class-validator';

/**
 * Query parameters of the request to search Assos.
 * @property {string} q - The query to search. Can be part of a name, mail or description in any language.
 * @property {number} page - The page of the results. Optional. Must be a positive number.
 */
export class AssosSearchDto {
  @IsString()
  @IsOptional()
  q?: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @IsOptional()
  page?: number;
}
