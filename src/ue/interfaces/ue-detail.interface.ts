import { Prisma } from '@prisma/client';

const UE_DETAIL_SELECT_FILTER = {
  select: {
    code: true,
    inscriptionCode: true,
    name: true,
    validationRate: true,
    info: {
      select: {
        antecedent: true,
        comment: true,
        degree: true,
        languages: true,
        minors: true,
        objectives: true,
        programme: true,
      },
    },
    openSemester: {
      select: {
        code: true,
      },
    },
    workTime: {
      select: {
        cm: true,
        td: true,
        tp: true,
        the: true,
        projet: true,
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
    filiere: {
      select: {
        code: true,
        name: true,
        branche: {
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
} as const;

type DeepWritable<T> = { -readonly [key in keyof T]: DeepWritable<T[key]> };
export type UEUnComputedDetail = DeepWritable<
  Prisma.UEGetPayload<typeof UE_DETAIL_SELECT_FILTER>
>;
export type UEDetail = Omit<
  UEUnComputedDetail,
  'openSemester' | 'starVotes'
> & {
  openSemester: string[];
  starVotes: { [key: string]: number };
};

export function SelectUEDetail<T>(arg: T): T & typeof UE_DETAIL_SELECT_FILTER {
  return {
    ...arg,
    ...UE_DETAIL_SELECT_FILTER,
  } as const;
}
