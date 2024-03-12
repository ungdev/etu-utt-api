import {
  User as UserModel,
  UserInfos as UserInfosModel,
  UserBranche,
  UserMailsPhones,
  UserSocialNetwork,
  UserPreference,
  UserAddress,
  AssoMembership as AssoMembershipModel,
  AssoMembershipRole,
  Asso,
} from '@prisma/client';

export type User = UserModel & {
  infos: UserInfosModel;
};

export type UserComplete = UserModel & {
  infos: UserInfosModel;
  branche: UserBranche;
  mailsPhones: UserMailsPhones;
  socialNetwork: UserSocialNetwork;
  preference: UserPreference;
  addresse: UserAddress;
};

export type UserAssoMembership = {
  startAt: Date;
  endAt: Date;
  role: string;
  asso: AssoResume;
};

export type AssoResume = {
  name: string;
  logo: string;
  descriptionShortTranslationId: string;
  mail: string;
};
