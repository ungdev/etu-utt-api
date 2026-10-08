import { User } from '@/users/interfaces/user.interface.js';
import { RawApiApplication } from '@/prisma/types.js';
import { PermissionManager } from '@/utils.js';

export interface RequestAuthData {
  application: RawApiApplication;
  user?: User;
  permissions: PermissionManager;
}
