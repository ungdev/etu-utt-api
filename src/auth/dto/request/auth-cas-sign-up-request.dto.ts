import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export default class AuthCasSignUpRequestDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Token that has been generated by route "POST /auth/cas/sign-in"' })
  registerToken: string;
}