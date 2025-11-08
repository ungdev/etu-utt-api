import { Permission } from '@/prisma/types';

export type ApiPermission = Permission & `API_${string}`;
export type UserPermission = Permission & `USER_${string}`;

export function isApiPermission(permission: Permission): permission is ApiPermission {
  return permission.startsWith('API_');
}
