import { Translation } from '../../../prisma/types';
import { IsNotEmpty, IsString, IsUrl, ValidateNested } from 'class-validator';

export class LinkUpdateReqDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @ValidateNested()
  name: Translation;

  @ValidateNested()
  tooltip: Translation;

  @IsUrl()
  @IsNotEmpty()
  link: string;
}