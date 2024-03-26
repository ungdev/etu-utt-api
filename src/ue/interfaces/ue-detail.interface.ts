import { Prisma } from '@prisma/client';

const UE_DETAIL_SELECT_FILTER = {
  select: {
    code: true,
    inscriptionCode: true,
    name: true,
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
        criterionId: 'asc',
      },
    },
  },
} as const satisfies Prisma.UEFindManyArgs;

type UEUnComputedDetail = Prisma.UEGetPayload<typeof UE_DETAIL_SELECT_FILTER>;
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

export function FormatUEDetail<T extends Prisma.UEGetPayload<typeof UE_DETAIL_SELECT_FILTER>>(ue: T): UEDetail & T {
  // We store rates in a object where the key is the criterion id and the value is a list ratings
  const starVoteCriteria: {
    [key: string]: {
      createdAt: Date;
      value: number;
    }[];
  } = {};
  for (const starVote of ue.starVotes) {
    if (starVote.criterionId in starVoteCriteria)
      starVoteCriteria[starVote.criterionId].push({
        createdAt: starVote.createdAt,
        value: starVote.value,
      });
    else
      starVoteCriteria[starVote.criterionId] = [
        {
          createdAt: starVote.createdAt,
          value: starVote.value,
        },
      ];
  }
  // Compute ratings for each criterion, using an exponential decay function
  // And turn semester into their respective code.
  return {
    ...ue,
    starVotes: Object.fromEntries(Object.entries(starVoteCriteria).map(([key, entry]) => [key, computeRate(entry)])),
  };
}

function computeRate(rates: Array<{ createdAt: Date; value: number }>) {
  let coefficients = 0;
  let ponderation = 0;
  const newestCreationTimestamp = rates.reduce((acc, rate) => Math.max(rate.createdAt.getTime(), acc), 0);
  for (const { value, createdAt } of rates) {
    const dt = (newestCreationTimestamp - createdAt.getTime()) / 1000;
    const dp = Math.exp(-dt / 10e7);
    ponderation += dp * value;
    coefficients += dp;
  }
  return Math.round((ponderation / coefficients) * 10) / 10;
}
