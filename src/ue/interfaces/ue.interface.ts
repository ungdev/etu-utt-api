import { Prisma, PrismaClient } from '@prisma/client';
import { generateCustomModel } from '../../prisma/prisma.service';
import { omit, translationSelect } from '../../utils';

const UE_SELECT_FILTER = {
  select: {
    code: true,
    subsequentUes: true,
    ueofs: {
      select: {
        code: true,
        name: translationSelect,
        available: true,
        siepId: true,
        inscriptionCode: true,
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
            branchOptions: {
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
    },
  },
  orderBy: {
    code: 'asc',
  },
} as const satisfies Prisma.UeFindManyArgs;

export type UnformattedUe = Prisma.UeGetPayload<typeof UE_SELECT_FILTER>;
export type Ue = Omit<UnformattedUe, 'ueofs'> & {
  ueofs: Omit<UnformattedUe['ueofs'] extends (infer R)[] ? R : never, 'starVotes' | 'available'>[];
  starVotes: {
    [key: string]: UeStarVoteEntry[];
  };
  creationYear: number;
  updateYear: number;
};
export type UeStarVoteEntry = {
  createdAt: Date;
  ueofCode: string;
  value: number;
};

export function generateCustomUeModel(prisma: PrismaClient) {
  return generateCustomModel(prisma, 'ue', UE_SELECT_FILTER, formatUe);
}

function formatUe(_: PrismaClient, ue: UnformattedUe): Ue {
  // We store rates in a object where the key is the criterion id and the value is a list ratings
  const starVoteCriteria: {
    [key: string]: UeStarVoteEntry[];
  } = {};
  for (const ueof of ue.ueofs) {
    for (const starVote of ueof.starVotes) {
      if (starVote.criterionId in starVoteCriteria)
        starVoteCriteria[starVote.criterionId].push({
          createdAt: starVote.createdAt,
          ueofCode: ueof.code,
          value: starVote.value,
        });
      else
        starVoteCriteria[starVote.criterionId] = [
          {
            createdAt: starVote.createdAt,
            ueofCode: ueof.code,
            value: starVote.value,
          },
        ];
    }
  }
  // Compute creationYear and updateYear
  const ueofYears = ue.ueofs
    .map((ueof) => Number(ueof.code.match(/\d+$/)?.[0]))
    .filter((ueof) => ueof)
    .sort();

  return {
    ...ue,
    ueofs: ue.ueofs.filter((ueof) => ueof.available).map(omit('available')),
    starVotes: starVoteCriteria,
    creationYear: 2000 + ueofYears[0],
    updateYear: 2000 + ueofYears[ueofYears.length - 1],
  };
}
