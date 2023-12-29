import {
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export default class TimetableCreateEntryDto {
  @IsString()
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
  @ArrayNotEmpty()
  @ArrayMinSize(1)
  groups: string[];
}
