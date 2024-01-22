import { Prisma } from '@prisma/client';

const RATE_SELECT_FILTER = {
  select: {
    criterionId: true,
    value: true,
  },
} as const;

type DeepWritable<T> = { -readonly [key in keyof T]: DeepWritable<T[key]> };
export type UERating = DeepWritable<Prisma.UEStarVoteGetPayload<typeof RATE_SELECT_FILTER>>;

export function SelectRate<T>(arg: T): T & typeof RATE_SELECT_FILTER {
  return {
    ...arg,
    ...RATE_SELECT_FILTER,
  } as const;
}
