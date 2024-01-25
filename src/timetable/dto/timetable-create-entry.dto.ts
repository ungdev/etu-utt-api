import { ArrayNotEmpty, IsArray, IsDate, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export default class TimetableCreateEntryDto {
  @IsString()
  @IsNotEmpty()
  location: string;

  @IsNumber()
  @IsNotEmpty()
  duration: number;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  firstRepetitionDate: Date;

  @IsNumber()
  @IsOptional()
  repetitionFrequency?: number = 0;

  @IsNumber()
  @IsOptional()
  repetitions?: number = 1;

  @IsArray()
  @IsNotEmpty()
  @ArrayNotEmpty()
  @IsUUID(4, { each: true })
  groups: string[];
}
