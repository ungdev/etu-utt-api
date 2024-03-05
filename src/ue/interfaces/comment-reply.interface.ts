import { Prisma } from '@prisma/client';
import { omit } from '../../utils';
import { CommentStatus } from './comment.interface';

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
    deletedAt: true,
  },
} as const;

export type UECommentReply = Omit<Prisma.UECommentReplyGetPayload<typeof REPLY_SELECT_FILTER>, 'deletedAt'> & {
  status: CommentStatus;
};

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

export function FormatReply<T extends Prisma.UECommentReplyGetPayload<typeof REPLY_SELECT_FILTER>>(
  answer: T,
): UECommentReply & Omit<T, 'deletedAt'> {
  return {
    ...omit(answer, 'deletedAt'),
    status: (answer.deletedAt && CommentStatus.DELETED) | CommentStatus.VALIDATED,
  };
}
