import { Prisma, PrismaClient } from '@prisma/client';
import { generateCustomModel } from '../../prisma/prisma.service';
import { translationSelect } from '../../utils';

const ASSO_MEMBERSHIPROLE_SELECT_FILTER = {
  select: {
    id: true,
    name: true,
    position: true,
    isPresident: true,
    assoMembership: {
      select: {
        permissions: {
          select: {
            id: true,
            description: translationSelect,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    },
  },
  orderBy: {
    name: 'asc',
  },
} as const satisfies Prisma.AssoMembershipRoleFindManyArgs;

export type AssoMembershipRole = Prisma.AssoMembershipRoleGetPayload<typeof ASSO_MEMBERSHIPROLE_SELECT_FILTER>;

export const generateCustomAssoMembershipRoleModel = (prisma: PrismaClient) =>
  generateCustomModel(prisma, 'assoMembershipRole', ASSO_MEMBERSHIPROLE_SELECT_FILTER, (_, r: AssoMembershipRole) => r);
