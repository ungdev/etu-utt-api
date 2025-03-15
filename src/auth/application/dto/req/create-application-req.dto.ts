import { IsString, IsUrl } from 'class-validator';

export default class CreateApplicationReqDto {
  @IsString()
  name: string;

  @IsUrl()
  redirectUrl: string;
}
