import { Type } from 'class-transformer';
import { IsNumber, IsPositive } from 'class-validator';

export class GetUECommentsDto {
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  page: number;
}
