import { RawUser, RawUserInfos, RawUserMailsPhones, RawUserSocialNetwork, RawUserPreference, RawUserAddress, RawUserBranch } from '../../prisma/types';

export interface User extends RawUser {
  infos: RawUserInfos;
  permissions: string[];
}

export type UserComplete = RawUser & {
  infos: RawUserInfos;
  branch: RawUserBranch;
  mailsPhones: RawUserMailsPhones;
  socialNetwork: RawUserSocialNetwork;
  preference: RawUserPreference;
  addresse: RawUserAddress;
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