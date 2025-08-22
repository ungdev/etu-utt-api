import { ApiPermission, UserPermission } from '../../../interfaces/permissions.interface';

export default class PermissionsResDto {
  apiPermissions: ApiPermission[];
  userPermissions: PermissionsResDto_UserPermissions[];
}

class PermissionsResDto_UserPermissions<SoftPermission extends boolean = boolean> {
  permission: UserPermission;
  isSoftPermission: SoftPermission;
  users: SoftPermission extends true ? string[] : null;
}
