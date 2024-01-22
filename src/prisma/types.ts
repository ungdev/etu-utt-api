import {
  User as RawUser,
  UserInfos as RawUserInfos,
  TimetableEntry as RawTimetableEntry,
  TimetableGroup as RawTimetableGroup,
  TimetableEntryOverride as RawTimetableEntryOverride,
} from '@prisma/client';

export { RawUser, RawUserInfos, RawTimetableEntry, RawTimetableGroup, RawTimetableEntryOverride };

export type UserBase = RawUser & {
  infos: RawUserInfos;
};

export type User = UserBase & {
  permissions: string[];
};
