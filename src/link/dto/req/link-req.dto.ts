import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsUrl,
  ValidateNested,
} from 'class-validator';
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
  hyperlink: string;

  @IsBoolean()
  @IsOptional()
  public?: boolean = true;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  position?: number;
}