import { ApiProperty } from '@nestjs/swagger';

export default class AssosAccessRequestResDto {
  @ApiProperty({ enum: ['CREATE', 'CLAIM'] })
  action: 'CREATE' | 'CLAIM';

  @ApiProperty({ example: 'asso@utt.fr' })
  email: string;
}
