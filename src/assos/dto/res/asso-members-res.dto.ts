import { UserMicroResDto } from '@/users/dto/res/user-micro-res.dto.js';

export class AssoMembersResDto {
  roles: AssoMembersRole[];
}

class AssoMembersRole {
  id: string;
  name: string;
  position: number;
  isPresident: boolean;
  members: UserMicroResDto[];
}
