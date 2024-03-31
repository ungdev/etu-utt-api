import { Prisma, PrismaClient } from '@prisma/client';
import { generateCustomModel } from '../../prisma/prisma.service';

const CRITERION_SELECT_FILTER = {
  select: {
    id: true,
    name: true,
  },
  orderBy: {
    name: 'asc',
  },
} as const;

export type Criterion = Prisma.UEStarCriterionGetPayload<typeof CRITERION_SELECT_FILTER>;

export function generateCustomCriterionModel(prisma: PrismaClient) {
  return generateCustomModel(prisma, 'uEStarCriterion', CRITERION_SELECT_FILTER, (criterion: Criterion) => criterion);
}
