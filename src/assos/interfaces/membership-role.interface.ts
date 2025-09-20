import { Prisma, PrismaClient, AssoMembership as PrismaAssoMembership } from '@prisma/client';
import { generateCustomModel } from '../../prisma/prisma.service';

const ASSO_MEMBERSHIPROLE_SELECT_FILTER = {
  select: {
    id: true,
    name: true,
    position: true,
    isPresident: true,
    assoMembership: {
      select: {
        id: true,
        startAt: true,
        endAt: true,
        permissions: {
          select: {
            id: true,
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
export type AssoMembership = PrismaAssoMembership & { permissions: { id: string }[] };

export const generateCustomAssoMembershipRoleModel = (prisma: PrismaClient) =>
  generateCustomModel(prisma, 'assoMembershipRole', ASSO_MEMBERSHIPROLE_SELECT_FILTER, (_, r: AssoMembershipRole) => r);
