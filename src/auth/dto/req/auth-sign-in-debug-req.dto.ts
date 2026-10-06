import { IsAlphanumeric, IsInt, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export default class AuthSignInDebugReqDto {
  @IsNotEmpty()
  @IsAlphanumeric()
  login: string;

  @IsInt()
  @Type(() => Number)
  @ApiProperty({ description: 'How much time the generated token should be valid' })
  tokenExpiresIn?: number;
}
