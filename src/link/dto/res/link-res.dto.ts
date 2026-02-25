import { ApiProperty } from '@nestjs/swagger';
import { Translation } from '../../../prisma/types';

export class LinkResDto {
  id: string;
  @ApiProperty({ type: String })
  name: Translation;
  @ApiProperty({ type: String })
  tooltip: Translation;
  hyperlink: string;
}