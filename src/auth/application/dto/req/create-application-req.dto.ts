import { IsString, IsUrl } from 'class-validator';

export class CreateApplicationReqDto {
  @IsString()
  name: string;

  @IsUrl()
  redirectUrl: string;
}
