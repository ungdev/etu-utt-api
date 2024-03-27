import { Prisma, PrismaClient } from '@prisma/client';
import { generateCustomModel } from '../../prisma/prisma.service';

const RATE_SELECT_FILTER = {
  select: {
    criterionId: true,
    value: true,
  },
  orderBy: {
    criterion: {
      name: 'asc',
    },
  },
} as const;

export type UERating = Prisma.UEStarVoteGetPayload<typeof RATE_SELECT_FILTER>;

export function generateCustomRateModel(prisma: PrismaClient) {
  return generateCustomModel<'uEStarVote', UERating>(prisma, 'uEStarVote', RATE_SELECT_FILTER);
}
