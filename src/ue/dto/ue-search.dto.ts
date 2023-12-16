import {
  IsNumber,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
  IsOptional,
} from 'class-validator';

export class UESearchDto {
  @IsString()
  @IsOptional()
  q?: string;

  @IsString()
  @IsOptional()
  branch?: string;

  @IsString()
  @IsOptional()
  filliere?: string;

  @IsString()
  @IsOptional()
  creditType?: string;

  @IsString()
  @MaxLength(3)
  @MinLength(3)
  @IsOptional()
  availableAtSemester?: string;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  page?: number;
}
