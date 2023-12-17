import { Prisma } from '@prisma/client';

const CRITERION_SELECT_FILTER = {
  select: {
    id: true,
    name: true,
  },
} as const;

type DeepWritable<T> = { -readonly [key in keyof T]: DeepWritable<T[key]> };
export type Criterion = DeepWritable<
  Prisma.UEStarCriterionGetPayload<typeof CRITERION_SELECT_FILTER>
>;

export function SelectCriterion<T>(arg: T): T & typeof CRITERION_SELECT_FILTER {
  return {
    ...arg,
    ...CRITERION_SELECT_FILTER,
  } as const;
}
