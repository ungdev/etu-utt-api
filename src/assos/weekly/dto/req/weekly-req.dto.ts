import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, ValidateNested } from 'class-validator';
import { TranslationReqDto } from '@/app.dto.js';
import { IsWeekDate } from '@/validation.js';

export class AssosPostWeeklyReqDto {
  @ValidateNested()
  @IsNotEmpty()
  @Type(() => TranslationReqDto)
  title: TranslationReqDto;

  @ValidateNested()
  @IsNotEmpty()
  @Type(() => TranslationReqDto)
  message: TranslationReqDto;

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  @IsWeekDate()
  date: Date;
}
