import { User } from '../../users/interfaces/user.interface';
import { Permission } from '@prisma/client';
import { Application } from '../application/interfaces/application.interface';
import {RawApiApplication} from "../../prisma/types";

export interface RequestAuthData {
  application: RawApiApplication;
  user?: User;
  permissions: RequestPermissions;
}

export type RequestPermissions = {
  [k in Permission]?: '*' | string[];
};
