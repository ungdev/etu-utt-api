import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export default class AssosAccessRequestReqDto {
  @ApiProperty({ example: 'asso@utt.fr' })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
