import { Prisma, PrismaClient } from '@prisma/client';
import { generateCustomModel } from '../../prisma/prisma.service';

const ASSO_MEMBERSHIP_SELECT_FILTER = {
  select: {
    id: true,
    roleId: true,
    userId: true,
    assoId: true,
    startAt: true,
    endAt: true,
    permissions: {
      select: {
        id: true,
      },
      orderBy: { id: 'asc' },
    },
  },
  orderBy: { startAt: 'asc' },
} as const satisfies Prisma.AssoMembershipFindManyArgs;

export type AssoMembership = Prisma.AssoMembershipGetPayload<typeof ASSO_MEMBERSHIP_SELECT_FILTER>;

export const generateCustomAssoMembershipModel = (prisma: PrismaClient) =>
  generateCustomModel(prisma, 'assoMembership', ASSO_MEMBERSHIP_SELECT_FILTER, (_, r: AssoMembership) => r);
