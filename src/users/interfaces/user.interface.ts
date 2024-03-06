import { Prisma } from '@prisma/client';

const USER_SELECT_FILTER = {
  select: {
    id: true,
    firstName: true,
    lastName: true,
    login: true,
    studentId: true,
    infos: {
      select: {
        nickname: true,
        website: true,
        passions: true,
        birthday: true,
        sex: true,
      },
    },
    permissions: {
      select: {
        userPermissionId: true,
      },
    },
  },
} satisfies { select: Prisma.UserSelect };

type UnformattedUser = Prisma.UserGetPayload<typeof USER_SELECT_FILTER>;
export type User = Omit<UnformattedUser, 'permissions'> & {
  permissions: string[];
};

/**
 * Generates the argument to use in prisma function to retrieve an object containing the necessary
 * properties to match against the {@link UnformattedUser} type.
 * @param arg extra arguments to provide to the prisma function. This includes `where` or `data` fields.
 * Sub arguments of the ones provided in {@link USER_SELECT_FILTER} will be ignored
 * @returns arguments to use in prisma function.
 *
 * @example
 * return this.prisma.uECommentReply.update(
 *   SelectUser({
 *     data: {
 *       firstName: user.firstName,
 *     },
 *     where: {
 *       id: user.id,
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

export function formatUser(user: Promise<UnformattedUser>): Promise<User>;
export function formatUser(user: UnformattedUser): User;
export function formatUser(user: UnformattedUser | Promise<UnformattedUser>): User | Promise<User> {
  const format = (user: UnformattedUser): User => ({
    ...user,
    permissions: user.permissions.map((permission) => permission.userPermissionId),
  });
  return user.toString().includes('Promise')
    ? (user as Promise<UnformattedUser>).then(format)
    : format(user as UnformattedUser);
}
