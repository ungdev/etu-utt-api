import { Prisma, PrismaClient } from '@prisma/client';
import { RequestType, generateCustomModel } from '../../../prisma/prisma.service';

const CREDIT_CATEGORY_SELECT_FILTER = {
  select: {
    code: true,
    name: true,
  },
  orderBy: {
    code: 'asc',
  },
} satisfies Partial<RequestType<'uECreditCategory'>>;

export type CreditCategory = Prisma.UECreditCategoryGetPayload<typeof CREDIT_CATEGORY_SELECT_FILTER>;

export function generateCustomCreditCategoryModel(prisma: PrismaClient) {
  return generateCustomModel(
    prisma,
    'uECreditCategory',
    CREDIT_CATEGORY_SELECT_FILTER,
    (_, creditCategory) => creditCategory,
  );
}
