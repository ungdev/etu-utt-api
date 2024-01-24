import { User as UserModel, UserInfos as UserInfosModel } from '@prisma/client';

export type UserBase = UserModel & {
  infos: UserInfosModel;
};

export type User = UserBase & {
  permissions: string[];
};
