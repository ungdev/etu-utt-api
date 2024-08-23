import { Type } from 'class-transformer';
import {
  IsAlphanumeric,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Query parameters to get comments.
 * @property page The page number to get. Defaults to 1 (Starting at 1).
 */
export default class GetUeCommentsReqDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @IsOptional()
  page?: number;

  @IsString()
  @IsNotEmpty()
  @IsAlphanumeric()
  @MinLength(3)
  @MaxLength(5)
  ueCode: string;
}
