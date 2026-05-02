import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsUrl,
  Min,
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

  @IsInt()
  @Min(0)
  @IsOptional()
  position?: number;
}