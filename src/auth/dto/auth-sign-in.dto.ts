import { IsNotEmpty, IsString } from 'class-validator';

export class AuthSignInDto {
  @IsString()
  @IsNotEmpty()
  login: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
