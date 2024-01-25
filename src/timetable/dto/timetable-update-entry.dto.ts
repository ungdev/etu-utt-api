import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export default class TimetableUpdateEntryDto {
  @IsString()
  @IsOptional()
  location?: string;

  @IsInt()
  @IsOptional()
  relativeStart?: number;

  @IsInt()
  @IsPositive()
  @IsOptional()
  occurrenceDuration?: number;

  @IsInt()
  @Min(0)
  @IsNotEmpty()
  updateFrom: number;

  @IsInt()
  @Min(0)
  @IsNotEmpty()
  updateUntil: number;

  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  applyEvery: number;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsUUID(4, { each: true })
  for: string[];
}
