import { IsString } from "class-validator";

export default class AuthCasSignInDto {
  @IsString()
  ticket: string;

  @IsString()
  service: string;
}
