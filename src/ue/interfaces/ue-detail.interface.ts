import { Prisma } from '@prisma/client';

const UE_DETAIL_SELECT_FILTER = {
  select: {
    code: true,
    inscriptionCode: true,
    name: true,
    validationRate: true,
    info: {
      select: {
        requirements: {
          select: {
            code: true,
          },
        },
        comment: true,
        degree: true,
        languages: true,
        minors: true,
        objectives: true,
        program: true,
      },
    },
    openSemester: {
      select: {
        code: true,
        start: true,
        end: true,
      },
      orderBy: {
        start: 'asc',
      },
    },
    workTime: {
      select: {
        cm: true,
        td: true,
        tp: true,
        the: true,
        project: true,
        internship: true,
      },
    },
    credits: {
      select: {
        credits: true,
        category: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    },
    branchOption: {
      select: {
        code: true,
        name: true,
        branch: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    },
    starVotes: {
      select: {
        criterionId: true,
        createdAt: true,
        value: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    },
  },
} as const satisfies Prisma.UEFindManyArgs;

export type UEUnComputedDetail = DeepWritable<Prisma.UEGetPayload<typeof UE_DETAIL_SELECT_FILTER>>;
export type UEDetail = Omit<UEUnComputedDetail, 'openSemester' | 'starVotes'> & {
  openSemester: Array<{ code: string; start: Date; end: Date }>;
  starVotes: { [key: string]: number };
};

/**
 * Generates the argument to use in prisma function to retrieve an object containing the necessary
 * properties to match against the {@link UEUnComputedDetail} type.
 *
 * In order to turn the {@link UEUnComputedDetail} into a {@link UEDetail}, you shall populate the `openSemester`
 * and `starVotes` fields the same way as in {@link getUE}
 * @param arg extra arguments to provide to the prisma function. This includes `where` or `data` fields.
 * Sub arguments of the ones provided in {@link UE_DETAIL_SELECT_FILTER} will be ignored
 * @returns arguments to use in prisma function.
 *
 * @example
 * const ue = await this.prisma.uE.findUnique(
 *   SelectUEDetail({
 *     where: {
 *       code,
 *     },
 *   }),
 * );
 */
export function SelectUEDetail<T>(arg: T): T & typeof UE_DETAIL_SELECT_FILTER {
  return {
    ...arg,
    ...UE_DETAIL_SELECT_FILTER,
  } as const;
}
