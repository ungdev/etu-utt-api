import { User } from '../../users/interfaces/user.interface';
import { RawApiApplication } from '../../prisma/types';
import { PermissionManager } from '../../utils';

export interface RequestAuthData {
  application: RawApiApplication;
  user?: User;
  permissions: PermissionManager;
}
