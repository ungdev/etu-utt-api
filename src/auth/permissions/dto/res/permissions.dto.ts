import { UserPermission } from '@/auth/interfaces/permissions.interface';
import { Permission } from '@/prisma/types';

export default class PermissionsResDto {
  hardPermissions: Permission[];
  softPermissions: PermissionsResDto_SoftPermissions[];
}

class PermissionsResDto_SoftPermissions {
  permission: UserPermission;
  users: string[];
}
