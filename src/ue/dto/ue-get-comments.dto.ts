import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsPositive } from 'class-validator';

/**
 * Query parameters to get comments.
 * @property page The page number to get. Defaults to 1 (Starting at 1).
 */
export class GetUECommentsDto {
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @IsOptional()
  page?: number;
}
