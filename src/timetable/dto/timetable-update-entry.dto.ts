import { ArrayNotEmpty, IsArray, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, IsUUID } from 'class-validator';

export default class TimetableUpdateEntryDto {
  @IsString()
  @IsOptional()
  location?: string;

  @IsInt()
  @IsNotEmpty()
  updateFrom: number;

  @IsInt()
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
