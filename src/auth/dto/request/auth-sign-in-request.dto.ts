import { IsAlphanumeric, IsNotEmpty, IsString } from 'class-validator';

export default class AuthSignInRequestDto {
  @IsNotEmpty()
  @IsAlphanumeric()
  login: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
