import { Prisma } from '@prisma/client';

const REPLY_SELECT_FILTER = {
  select: {
    id: true,
    author: {
      select: {
        id: true,
        lastName: true,
        firstName: true,
        studentId: true,
      },
    },
    body: true,
    createdAt: true,
    updatedAt: true,
  },
} as const;

export type UECommentReply = DeepWritable<Prisma.UECommentReplyGetPayload<typeof REPLY_SELECT_FILTER>>;

/**
 * Generates the argument to use in prisma function to retrieve an object containing the necessary
 * properties to match against the {@link UECommentReply} type.
 * @param arg extra arguments to provide to the prisma function. This includes `where` or `data` fields.
 * Sub arguments of the ones provided in {@link REPLY_SELECT_FILTER} will be ignored
 * @returns arguments to use in prisma function.
 *
 * @example
 * return this.prisma.uECommentReply.update(
 *   SelectCommentReply({
 *     data: {
 *       body: reply.body,
 *     },
 *     where: {
 *       id: replyId,
 *     },
 *   }),
 * );
 */
export function SelectCommentReply<T>(arg: T): T & typeof REPLY_SELECT_FILTER {
  return {
    ...arg,
    ...REPLY_SELECT_FILTER,
  } as const;
}
