import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export default class AuthCasSignInReqDto {
  @IsString()
  @IsNotEmpty()
  ticket: string;

  @IsString()
  @IsNotEmpty()
  service: string;

  @IsInt()
  @Type(() => Number)
  @ApiProperty({ description: 'How much time the generated token should be valid' })
  tokenExpiresIn?: number;
}
