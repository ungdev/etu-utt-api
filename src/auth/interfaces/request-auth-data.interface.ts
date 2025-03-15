import { User } from '../../users/interfaces/user.interface';
import { Permission } from '@prisma/client';
import { Application } from '../application/interfaces/application.interface';

export interface RequestAuthData {
  application: Application;
  user?: User;
  permissions: RequestPermissions;
}

export type RequestPermissions = {
  [k in Permission]?: '*' | string[];
};
