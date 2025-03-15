import { Prisma, PrismaClient } from '@prisma/client';
import { generateCustomModel } from '../../../prisma/prisma.service';

const APPLICATION_SELECT_FILTER = {
  select: {
    id: true,
    name: true,
    userId: true,
    redirectUrl: true,
    clientSecret: true,
  },
  orderBy: {
    name: 'asc',
  },
} as const satisfies Prisma.ApiApplicationFindManyArgs;

export type Application = Prisma.ApiApplicationGetPayload<typeof APPLICATION_SELECT_FILTER>;

export function generateCustomApplicationModel(prisma: PrismaClient) {
  return generateCustomModel(prisma, 'apiApplication', APPLICATION_SELECT_FILTER, (_, rating: Application) => rating);
}
