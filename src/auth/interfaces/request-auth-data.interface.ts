import { User } from '../../users/interfaces/user.interface';
import { Permission } from '@prisma/client';

export interface RequestAuthData {
  applicationId: string;
  user?: User;
  permissions: RequestPermissions;
}

export type RequestPermissions = {
  [k in Permission]?: '*' | string[];
};
