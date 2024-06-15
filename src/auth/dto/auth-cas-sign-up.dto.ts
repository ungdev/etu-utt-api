import { IsNotEmpty, IsString } from 'class-validator';

export class AuthCasSignUpDto {
  @IsString()
  @IsNotEmpty()
  registerToken: string;
}
