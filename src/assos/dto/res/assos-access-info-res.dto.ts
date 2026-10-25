import { ApiProperty } from '@nestjs/swagger';

export class AssosAccessInfoResDto {
  @ApiProperty({ enum: ['CREATE', 'CLAIM'] })
  action: 'CREATE' | 'CLAIM';

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string | null;
}
