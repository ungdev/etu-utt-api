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
import { TranslatedTextDto } from 'src/utils';

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
  @ValidateNested()
  @Type(() => TranslatedTextDto)
  descriptionShort?: TranslatedTextDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TranslatedTextDto)
  description?: TranslatedTextDto;

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
