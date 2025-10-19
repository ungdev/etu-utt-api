import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, ValidateNested } from 'class-validator';
import { TranslationReqDto } from '../../../app.dto';
import { IsFutureDate } from '../../../validation';

export default class AssosPostDaymailReqDto {
  @ValidateNested()
  @Type(() => TranslationReqDto)
  title: TranslationReqDto

  @ValidateNested()
  @IsNotEmpty()
  @Type(() => TranslationReqDto)
  message: TranslationReqDto;

  @IsDate({ each: true })
  @IsNotEmpty()
  @Type(() => Date)
  @IsFutureDate({ each: true })
  dates: Date[];
}