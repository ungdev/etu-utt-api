import UserMicroResDto from 'src/users/dto/res/user-micro-res.dto';

export default class AssoRoleResDto {
  id: string;
  name: string;
  position: number;
  isPresident: boolean;
}

export class AssoRoleListResDto {
  roles: AssoRoleResDto[];
}

export class AssoRoleListWithMembersResDto extends AssoRoleResDto {
  roles: (UserMicroResDto & { userid: string; startAt: Date; endAt: Date })[];
}
