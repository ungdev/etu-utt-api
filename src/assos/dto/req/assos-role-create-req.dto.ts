import { IsNotEmpty, IsString } from 'class-validator';

export default class AssosRoleCreateReqDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
