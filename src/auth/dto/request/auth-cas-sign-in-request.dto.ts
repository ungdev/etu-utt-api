import { IsString } from 'class-validator';

export default class AuthCasSignInRequestDto {
  @IsString()
  ticket: string;

  @IsString()
  service: string;
}
