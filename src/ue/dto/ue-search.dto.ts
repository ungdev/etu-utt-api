import { Type } from 'class-transformer';
import { IsNumber, IsPositive, IsString, MaxLength, MinLength, IsOptional } from 'class-validator';

export class UESearchDto {
  @IsString()
  @IsOptional()
  q?: string;

  @IsString()
  @IsOptional()
  branch?: string;

  @IsString()
  @IsOptional()
  filiere?: string;

  @IsString()
  @IsOptional()
  creditType?: string;

  @IsString()
  @MaxLength(3)
  @MinLength(3)
  @IsOptional()
  availableAtSemester?: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @IsOptional()
  page?: number;
}
