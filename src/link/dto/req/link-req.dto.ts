import { IsNotEmpty, IsObject, IsUrl, ValidateNested } from 'class-validator';
import { TranslationReqDto } from '../../../app.dto';
import { Type } from 'class-transformer';

export class LinkReqDto {
  @IsObject()
  @ValidateNested()
  @Type(() => TranslationReqDto)
  name: TranslationReqDto;

  @IsObject()
  @ValidateNested()
  @Type(() => TranslationReqDto)
  tooltip: TranslationReqDto;

  @IsUrl()
  @IsNotEmpty()
  link: string;
}