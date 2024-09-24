import { IsString } from 'class-validator';

export default class AuthCasSignInReqDto {
  @IsString()
  ticket: string;

  @IsString()
  service: string;
}
