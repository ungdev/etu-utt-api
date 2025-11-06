import { Prisma, PrismaClient } from '@prisma/client';
import { generateCustomModel } from '../../prisma/prisma.service';
import { pick, translationSelect } from '../../utils';
import { Translation } from '../../prisma/types';

const ASSO_DAYMAIL_SELECT_FILTER = {
  select: {
    id: true,
    assoId: true,
    createdAt: true,
    titleTranslation: translationSelect,
    bodyTranslation: translationSelect,
    sendDates: {
      select: {
        date: true,
      },
      orderBy: {
        date: 'asc',
      }
    }
  },
} as const satisfies Prisma.AssoDaymailFindManyArgs;

export type UnformattedAssoDaymail = Prisma.AssoDaymailGetPayload<typeof ASSO_DAYMAIL_SELECT_FILTER>;
export type AssoDaymail = Pick<UnformattedAssoDaymail, 'id' | 'assoId' | 'createdAt'> & { title: Translation, message: Translation, sendDates: Date[] }

export const generateCustomAssoDaymailModel = (prisma: PrismaClient) =>
  generateCustomModel(prisma, 'assoDaymail', ASSO_DAYMAIL_SELECT_FILTER, formatAssoDaymail);

function formatAssoDaymail(_: PrismaClient, r: UnformattedAssoDaymail): AssoDaymail {
  return {
    ...pick(r, 'id', 'assoId', 'createdAt'), title: r.titleTranslation, message: r.bodyTranslation, sendDates: r.sendDates.map((s) => s.date)
  }
}
