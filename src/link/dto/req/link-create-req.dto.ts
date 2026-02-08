import { Translation } from '../../../prisma/types';
import { IsNotEmpty, IsUrl, ValidateNested } from 'class-validator';

export class LinkCreateReqDto {
  @ValidateNested()
  name: Translation;

  @ValidateNested()
  tooltip: Translation;

  @IsUrl()
  @IsNotEmpty()
  link: string;
}