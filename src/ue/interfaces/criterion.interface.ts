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

export type Criterion = Prisma.UeStarCriterionGetPayload<typeof CRITERION_SELECT_FILTER>;

export function generateCustomCriterionModel(prisma: PrismaClient) {
  return generateCustomModel(
    prisma,
    'ueStarCriterion',
    CRITERION_SELECT_FILTER,
    (_, criterion: Criterion) => criterion,
  );
}
