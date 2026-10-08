import { UserPermission } from '@/auth/interfaces/permissions.interface.js';
import { Permission } from '@/prisma/types.js';

export class PermissionsResDto {
  hardPermissions: Permission[];
  softPermissions: PermissionsResDto_SoftPermissions[];
}

class PermissionsResDto_SoftPermissions {
  permission: UserPermission;
  users: string[];
}
