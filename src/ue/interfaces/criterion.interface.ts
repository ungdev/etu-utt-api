import { Prisma, PrismaClient } from '@prisma/client';
import { generateCustomModel } from '../../prisma/prisma.service';

const CRITERION_SELECT_FILTER = {
  select: {
    id: true,
    name: true,
  },
  orderBy: [{ name: 'asc' }, { id: 'asc' }],
} as const;
type CriterionFilterType = typeof CRITERION_SELECT_FILTER extends { orderBy: readonly (infer T)[] }
  ? Omit<typeof CRITERION_SELECT_FILTER, 'orderBy'> & { orderBy: T[] }
  : typeof CRITERION_SELECT_FILTER;

export type Criterion = Prisma.UeStarCriterionGetPayload<CriterionFilterType>;

export function generateCustomCriterionModel(prisma: PrismaClient) {
  return generateCustomModel(
    prisma,
    'ueStarCriterion',
    CRITERION_SELECT_FILTER as unknown as CriterionFilterType,
    (_, criterion: Criterion) => criterion,
  );
}
