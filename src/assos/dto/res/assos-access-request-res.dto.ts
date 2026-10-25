import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class AssosAccessRequestResDto {
  @ApiProperty({ enum: ['CREATE', 'CLAIM'] })
  action: 'CREATE' | 'CLAIM';

  @ApiProperty({ example: 'asso@utt.fr' })
  @IsEmail()
  email: string;
}
