import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';

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
