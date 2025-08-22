import { Permission } from '@prisma/client';

export const ALL_PERMISSIONS = '*';
export type ALL_PERMISSIONS = typeof ALL_PERMISSIONS;

export type ApiPermission = Permission & `API_${string}`;
export type UserPermission = Permission & `USER_${string}`;

export function isApiPermission(permission: Permission): permission is ApiPermission {
  return permission.startsWith('API_');
}
