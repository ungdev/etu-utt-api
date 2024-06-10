import { Prisma, PrismaClient } from '@prisma/client';
import { generateCustomModel } from '../../prisma/prisma.service';
import { translationSelect } from '../../utils';

const UE_SELECT_FILTER = {
  select: {
    id: true,
    code: true,
    inscriptionCode: true,
    name: translationSelect,
    info: {
      select: {
        requirements: {
          select: {
            code: true,
          },
        },
        comment: translationSelect,
        degree: true,
        languages: true,
        minors: true,
        objectives: translationSelect,
        program: translationSelect,
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
  orderBy: {
    code: 'asc',
  },
} as const satisfies Prisma.UEFindManyArgs;

export type UnformattedUE = Prisma.UEGetPayload<typeof UE_SELECT_FILTER>;
export type UE = Omit<UnformattedUE, 'starVotes'> & {
  starVotes: { [key: string]: number };
};

export function generateCustomUEModel(prisma: PrismaClient) {
  return generateCustomModel(prisma, 'uE', UE_SELECT_FILTER, formatUE);
}

function formatUE(_: PrismaClient, ue: UnformattedUE): UE {
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

export function computeRate(rates: Array<{ createdAt: Date; value: number }>) {
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
