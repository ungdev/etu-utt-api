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

/**
 * Generates the argument to use in prisma function to retrieve an object containing the necessary
 * properties to match against the {@link UEOverView} type.
 *
 * The {@link UEOverView} type only contains partial ue data and should not be used to display ue details.
 * Consider using {@link UEDetail} instead.
 *
 * @param arg extra arguments to provide to the prisma function. This includes `where` or `data` fields
 * @returns arguments to use in prisma function.
 *
 * @example
 * this.prisma.uE.findMany(
 *   SelectUEOverview({
 *     where,
 *     take: Number(this.config.get('PAGINATION_PAGE_SIZE')),
 *     skip:
 *       ((query.page ?? 1) - 1) *
 *       Number(this.config.get<number>('PAGINATION_PAGE_SIZE')),
 *     orderBy: {
 *       code: 'asc',
 *     },
 *   }),
 * );
 */
export function SelectUEOverview<T>(
  arg: T,
): T & typeof UE_OVERVIEW_SELECT_FILTER {
  return {
    ...arg,
    ...UE_OVERVIEW_SELECT_FILTER,
  } as const;
}
