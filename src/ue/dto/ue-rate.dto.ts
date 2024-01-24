import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';

/**
 * Body of the request to rate an UE.
 * @property {string} criterion - The id of the criterion to rate.
 * @property {number} value - The value of the rating. Must be between 1 and 5.
 */
export class UERateDto {
  @IsString()
  @IsNotEmpty()
  criterion: string;

  @Type(() => Number)
  @IsNumber()
  @Max(5)
  @Min(1)
  value: number;
}
