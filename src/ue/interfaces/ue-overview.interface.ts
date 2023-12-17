import { Prisma } from '@prisma/client';

const UE_OVERVIEW_SELECT_FILTER = {
  select: {
    code: true,
    inscriptionCode: true,
    name: true,
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
        branche: {
          select: {
            code: true,
            name: true,
          },
        },
        code: true,
        name: true,
      },
    },
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
        start: true,
        end: true,
      },
    },
  },
} as const;

type DeepWritable<T> = { -readonly [key in keyof T]: DeepWritable<T[key]> };
export type UEOverView = DeepWritable<
  Prisma.UEGetPayload<typeof UE_OVERVIEW_SELECT_FILTER>
>;

export function SelectUEOverview<T>(
  arg: T,
): T & typeof UE_OVERVIEW_SELECT_FILTER {
  return {
    ...arg,
    ...UE_OVERVIEW_SELECT_FILTER,
  } as const;
}
