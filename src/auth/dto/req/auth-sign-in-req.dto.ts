import { IsAlphanumeric, IsNotEmpty, IsString } from 'class-validator';

export default class AuthSignInReqDto {
  @IsNotEmpty()
  @IsAlphanumeric()
  login: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
