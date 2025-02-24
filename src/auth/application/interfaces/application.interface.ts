import { Prisma } from '@prisma/client';

const APPLICATION_SELECT_FILTER = {
  select: {
    id: true,
    name: true,
    userId: true,
    redirectUrl: true,
    clientSecret: true,
  },
} as const satisfies Prisma.ApiApplicationFindManyArgs;

export type Application = Prisma.ApiApplicationGetPayload<typeof APPLICATION_SELECT_FILTER>;
export function SelectApplication<T>(arg: T): T & typeof APPLICATION_SELECT_FILTER {
  return {
    ...arg,
    ...APPLICATION_SELECT_FILTER,
  } as const;
}
