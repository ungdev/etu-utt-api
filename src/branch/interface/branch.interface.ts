import { Prisma } from '@prisma/client';

const BRANCH_SELECT_FILTER = {
  select: {
    code: true,
    name: true,
    branchOptions: {
      select: {
        code: true,
        name: true,
      },
      orderBy: {
        code: 'asc',
      },
    },
  },
  orderBy: {
    code: 'asc',
  },
} as const satisfies Prisma.UTTBranchFindManyArgs;

export type Branch = Prisma.UTTBranchGetPayload<typeof BRANCH_SELECT_FILTER>;
export function SelectBranch<T>(arg: T): T & typeof BRANCH_SELECT_FILTER {
  return {
    ...arg,
    ...BRANCH_SELECT_FILTER,
  } as const;
}
