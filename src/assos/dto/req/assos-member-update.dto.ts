import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export default class AssosMemberUpdateReqDto {
  @IsString()
  @IsNotEmpty()
  roleId: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  permissions: string[];
}
