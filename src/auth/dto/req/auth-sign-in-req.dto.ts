import { IsAlphanumeric, IsInt, IsNotEmpty, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export default class AuthSignInReqDto {
  @IsNotEmpty()
  @IsAlphanumeric()
  login: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsInt()
  @Type(() => Number)
  @ApiProperty({ description: 'How much time the generated token should be valid' })
  tokenExpiresIn?: number;
}
