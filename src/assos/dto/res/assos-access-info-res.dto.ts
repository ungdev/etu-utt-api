import { ApiProperty } from '@nestjs/swagger';
import { Translation } from '../../../prisma/types';

export default class AssosAccessInfoResDto {
  @ApiProperty({ enum: ['CREATE', 'CLAIM'] })
  action: 'CREATE' | 'CLAIM';

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string | null;

  @ApiProperty({ nullable: true, type: Object })
  description: Translation | null;
}
