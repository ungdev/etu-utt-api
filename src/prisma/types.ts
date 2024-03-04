import {
  User as UserModel,
  UserInfos as UserInfosModel,
  UserBranche,
  UserMailsPhones,
  UserSocialNetwork,
  UserPreference,
  UserAddress,
  AssoMembership,
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

export type UserAssociation = AssoMembership & {
  roles: AssoMembershipRole[];
  asso: Asso;
};
