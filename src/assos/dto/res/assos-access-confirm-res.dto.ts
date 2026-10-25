import { ApiProperty } from '@nestjs/swagger';

export class AssosAccessConfirmedAssoDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ example: 'asso@utt.fr' })
  email: string;
}

export class AssosAccessConfirmResDto {
  @ApiProperty({ enum: ['CREATE', 'CLAIM'] })
  action: 'CREATE' | 'CLAIM';

  @ApiProperty({ type: AssosAccessConfirmedAssoDto })
  asso: AssosAccessConfirmedAssoDto;
}
