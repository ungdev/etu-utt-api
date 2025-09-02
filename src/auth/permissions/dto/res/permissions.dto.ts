import { ApiPermission, UserPermission } from '../../../interfaces/permissions.interface';
import {Permission} from "@prisma/client";

export default class PermissionsResDto {
  hardPermissions: Permission[];
  softPermissions: PermissionsResDto_SoftPermissions[];
}

class PermissionsResDto_SoftPermissions {
  permission: UserPermission;
  users: string[];
}
