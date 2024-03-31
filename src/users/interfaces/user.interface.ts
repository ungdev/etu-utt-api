import { Prisma, PrismaClient } from '@prisma/client';
import { generateCustomModel, RequestType } from '../../prisma/prisma.service';

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
  orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
} satisfies Partial<RequestType<'user'>>;

export type UnformattedUser = Prisma.UserGetPayload<typeof USER_SELECT_FILTER>;
export type User = Omit<UnformattedUser, 'permissions'> & {
  permissions: string[];
};

export const generateCustomUserModel = (prisma: PrismaClient) =>
  generateCustomModel(prisma, 'user', USER_SELECT_FILTER, formatUser);

export function formatUser(user: UnformattedUser): User {
  return {
    ...user,
    permissions: user.permissions.map((permission) => permission.userPermissionId),
  };
}
