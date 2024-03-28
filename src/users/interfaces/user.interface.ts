import { Prisma } from '@prisma/client';

const USER_SELECT_FILTER = {
  select: {
    id: true,
    firstName: true,
    lastName: true,
    login: true,
    permissions: true,
    hash: true,
    studentId: true,
    rgpdId: true,
    role: true,
    infos: {
      select: {
        birthday: true,
        nickname: true,
        sex: true,
        nationality: true,
        avatar: true,
        passions: true,
        website: true,
      },
    },
  },
} as const satisfies Prisma.UserFindManyArgs;

export type UnformattedUser = Prisma.UserGetPayload<typeof USER_SELECT_FILTER>;
export type User = Omit<UnformattedUser, 'permissions'> & {
  permissions: string[];
};

/**
 * Generates the argument to use in prisma function to retrieve an object containing the necessary
 * properties to match against the {@link UEComment} type.
 * @param arg extra arguments to provide to the prisma function. This includes `where` or `data` fields.
 * Sub arguments of the ones provided in {@link USER_SELECT_FILTER} will be ignored
 * @returns arguments to use in prisma function.
 *
 * @example
 * const comment = await this.prisma.user.update(
 *   SelectUser({
 *     where: {
 *       id: userId,
 *     },
 *     data: {
 *       firstName: body.firstName,
 *       lastName: body.lastName,
 *     },
 *   }),
 * );
 */
export function SelectUser<T>(arg: T): T & typeof USER_SELECT_FILTER {
  return {
    ...arg,
    ...USER_SELECT_FILTER,
  } as const;
}
