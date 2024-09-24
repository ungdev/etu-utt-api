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
} as const satisfies Partial<RequestType<'ueCreditCategory'>>;

export type CreditCategory = Prisma.UeCreditCategoryGetPayload<typeof CREDIT_CATEGORY_SELECT_FILTER>;

export function generateCustomCreditCategoryModel(prisma: PrismaClient) {
  return generateCustomModel(
    prisma,
    'ueCreditCategory',
    CREDIT_CATEGORY_SELECT_FILTER,
    (_, creditCategory: CreditCategory) => creditCategory,
  );
}
