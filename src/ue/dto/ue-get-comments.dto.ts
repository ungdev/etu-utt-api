import { IsNumber, IsPositive } from 'class-validator';

export class GetUECommentsDto {
  @IsNumber()
  @IsPositive()
  page: number;
}
