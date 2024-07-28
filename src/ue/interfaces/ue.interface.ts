import { Prisma, PrismaClient } from '@prisma/client';
import { generateCustomModel } from '../../prisma/prisma.service';
import { translationSelect } from '../../utils';

const UE_SELECT_FILTER = {
  select: {
    code: true,
    updateYear: true,
    creationYear: true,
    subsequentUes: true,
    ueofs: {
      where: {
        available: true,
      },
      select: {
        name: translationSelect,
        siepId: true,
        requirements: {
          select: {
            code: true,
          },
        },
        info: {
          select: {
            language: true,
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
} as const satisfies Prisma.UeFindManyArgs;

export type UnformattedUe = Prisma.UeGetPayload<typeof UE_SELECT_FILTER>;
export type Ue = Omit<UnformattedUe, 'starVotes'> & {
  starVotes: { [key: string]: number };
};

export function generateCustomUeModel(prisma: PrismaClient) {
  return generateCustomModel(prisma, 'ue', UE_SELECT_FILTER, formatUe);
}

function formatUe(_: PrismaClient, ue: UnformattedUe): Ue {
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
