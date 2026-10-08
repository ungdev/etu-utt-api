import { IsNotEmpty, IsString } from 'class-validator';

export class AssosRoleCreateReqDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
