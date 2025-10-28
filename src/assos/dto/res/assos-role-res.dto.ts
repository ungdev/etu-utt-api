import UserMicroResDto from '../../../users/dto/res/user-micro-res.dto';

export default class AssoRoleOverviewResDto {
  id: string;
  name: string;
  position: number;
  isPresident: boolean;
}

export class AssoRoleListResDto {
  roles: AssoRoleOverviewResDto[];
}

export class AssoRoleResDto {
  roles: AssoRole[];
}

export class AssoRole extends AssoRoleOverviewResDto {
  members: AssoRoleMember[];
}

class AssoRoleMember extends UserMicroResDto {
  userId: string;
  startAt: Date;
  endAt: Date;
  permissions: string[];
}
