import { User as UserModel, UserInfos as UserInfosModel } from '@prisma/client';

export type User = UserModel & {
  infos: UserInfosModel;
};
