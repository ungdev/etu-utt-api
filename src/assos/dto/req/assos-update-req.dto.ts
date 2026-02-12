import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUrl,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { TranslationReqDto } from '../../../app.dto';

export default class AssosUpdateReqDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  logo?: string;

  @IsOptional()
  @Type(() => TranslationReqDto)
  @ValidateNested()
  descriptionShort?: TranslationReqDto;

  @IsOptional()
  @Type(() => TranslationReqDto)
  @ValidateNested()
  description?: TranslationReqDto;

  @IsOptional()
  @IsString()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @IsPhoneNumber()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  website?: string;
}
