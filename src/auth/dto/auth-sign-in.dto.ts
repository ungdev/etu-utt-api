import { IsAlphanumeric, IsNotEmpty, IsString } from 'class-validator';

export class AuthSignInDto {
  @IsNotEmpty()
  @IsAlphanumeric()
  login: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
