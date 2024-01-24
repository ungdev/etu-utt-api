import { Prisma } from '@prisma/client';

const CRITERION_SELECT_FILTER = {
  select: {
    id: true,
    name: true,
  },
} as const;

export type Criterion = DeepWritable<
  Prisma.UEStarCriterionGetPayload<typeof CRITERION_SELECT_FILTER>
>;

/**
 * Generates the argument to use in prisma function to retrieve an object containing the necessary
 * properties to match against the {@link Criterion} type.
 * @param arg extra arguments to provide to the prisma function. This includes `where` or `data` fields.
 * Sub arguments of the ones provided in {@link CRITERION_SELECT_FILTER} will be ignored
 * @returns arguments to use in prisma function.
 *
 * @example
 * return this.prisma.uEStarCriterion.findMany(
 *   SelectCriterion({
 *     orderBy: {
 *       name: 'asc',
 *     },
 *   }),
 * );
 */
export function SelectCriterion<T>(arg: T): T & typeof CRITERION_SELECT_FILTER {
  return {
    ...arg,
    ...CRITERION_SELECT_FILTER,
  } as const;
}
