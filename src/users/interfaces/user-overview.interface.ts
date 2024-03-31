import { Prisma } from '@prisma/client';

const USER_OVERVIEW_SELECT_FILTER = {
  select: {
    firstName: true,
    lastName: true,
    nickName: true,
    avatar: true,
    semester: true,
    branch: true,
    branchOption: true,
    mail: true,
    phoneNumber: true,
  },
} as const;

export type UserOverView = DeepWritable<Prisma.UserGetPayload<typeof USER_OVERVIEW_SELECT_FILTER>>;

export function SelectUsersOverview<T>(arg: T): T & typeof USER_OVERVIEW_SELECT_FILTER {
  return {
    ...arg,
    ...USER_OVERVIEW_SELECT_FILTER,
  } as const;
}
