import { Prisma } from '@prisma/client';

const RATE_SELECT_FILTER = {
  select: {
    criterionId: true,
    value: true,
  },
} as const;

export type UERating = DeepWritable<
  Prisma.UEStarVoteGetPayload<typeof RATE_SELECT_FILTER>
>;

/**
 * Generates the argument to use in prisma function to retrieve an object containing the necessary
 * properties to match against the {@link UERating} type.
 * @param arg extra arguments to provide to the prisma function. This includes `where` or `data` fields.
 * Sub arguments of the ones provided in {@link RATE_SELECT_FILTER} will be ignored
 * @returns arguments to use in prisma function.
 *
 * @example
 * return this.prisma.uEStarVote.findMany(
 *   SelectRate({
 *     where: {
 *       userId: user.id,
 *       ueId: UE.id,
 *     },
 *     orderBy: {
 *       criterion: {
 *         name: 'asc',
 *       },
 *     },
 *   }),
 * );
 */
export function SelectRate<T>(arg: T): T & typeof RATE_SELECT_FILTER {
  return {
    ...arg,
    ...RATE_SELECT_FILTER,
  } as const;
}
