import { Prisma, PrismaClient , Translation } from '@/prisma/types';
import { generateCustomModel } from '@/prisma/prisma.service';
import { pick, translationSelect } from '@/utils';

const ASSO_WEEKLY_SELECT_FILTER = {
  select: {
    id: true,
    assoId: true,
    createdAt: true,
    titleTranslation: translationSelect,
    bodyTranslation: translationSelect,
    date: true,
  },
  orderBy: { date: 'asc'}
} as const satisfies Prisma.AssoWeeklyFindManyArgs;

export type UnformattedAssoWeekly = Prisma.AssoWeeklyGetPayload<typeof ASSO_WEEKLY_SELECT_FILTER>;
export type AssoWeekly = Pick<UnformattedAssoWeekly, 'id' | 'assoId' | 'createdAt' | 'date'> & { title: Translation, message: Translation }

export const generateCustomAssoWeeklyModel = (prisma: PrismaClient) =>
  generateCustomModel(prisma, 'assoWeekly', ASSO_WEEKLY_SELECT_FILTER, formatAssoWeekly);

function formatAssoWeekly(_: PrismaClient, r: UnformattedAssoWeekly): AssoWeekly {
  return {
    ...pick(r, 'id', 'assoId', 'createdAt', 'date'), title: r.titleTranslation, message: r.bodyTranslation
  }
}
