import { IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';

export class UERateDto {
  @IsString()
  @IsNotEmpty()
  criterion: string;

  @IsNumber()
  @Max(5)
  @Min(1)
  value: number;
}
