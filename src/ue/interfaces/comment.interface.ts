import { Prisma } from '@prisma/client';
import { omit } from '../../utils';
import { FormatReply, UECommentReply } from './comment-reply.interface';

const COMMENT_SELECT_FILTER = {
  select: {
    id: true,
    author: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        studentId: true,
      },
    },
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    validatedAt: true,
    semester: {
      select: {
        code: true,
      },
    },
    isAnonymous: true,
    body: true,
    answers: {
      select: {
        id: true,
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true,
          },
        },
        body: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
      where: {
        deletedAt: null,
      },
    },
    upvotes: {
      select: {
        userId: true,
      },
    },
  },
} as const;

type UERawComment = DeepWritable<Prisma.UECommentGetPayload<typeof COMMENT_SELECT_FILTER>>;
export type UEComment = Omit<UERawComment, 'upvotes' | 'deletedAt' | 'validatedAt'> & {
  upvotes: number;
  upvoted: boolean;
  status: CommentStatus;
  answers: UECommentReply[];
};

/**
 * Generates the argument to use in prisma function to retrieve an object containing the necessary
 * properties to match against the {@link UEComment} type.
 * @param arg extra arguments to provide to the prisma function. This includes `where` or `data` fields.
 * Sub arguments of the ones provided in {@link COMMENT_SELECT_FILTER} will be ignored
 * @returns arguments to use in prisma function.
 *
 * @example
 * const comment = await this.prisma.uEComment.update(
 *   SelectComment({
 *     where: {
 *       id: commentId,
 *     },
 *     data: {
 *       body: body.body,
 *       isAnonymous: body.isAnonymous,
 *     },
 *   }),
 * );
 */
export function SelectComment<T>(
  arg: T,
  userId: string,
  includeDeletedReplied = false,
  includeReportedReplies = false,
): T & typeof COMMENT_SELECT_FILTER {
  Object.assign(COMMENT_SELECT_FILTER.select.answers.where, {
    deletedAt: includeDeletedReplied ? undefined : null,
    OR: [
      {
        reports: {
          none: {
            mitigated: false,
          },
        },
      },
      {
        authorId: includeReportedReplies ? undefined : userId,
      },
    ],
  });
  return {
    ...arg,
    ...COMMENT_SELECT_FILTER,
  } as const;
}

export function FormatComment<T extends Prisma.UECommentGetPayload<typeof COMMENT_SELECT_FILTER>>(
  comment: T,
  userId: string,
): UEComment & Omit<T, 'deletedAt' | 'validatedAt'> {
  return {
    ...omit(comment, 'deletedAt', 'validatedAt'),
    answers: comment.answers.map(FormatReply),
    status: comment.deletedAt
      ? CommentStatus.DELETED
      : comment.validatedAt
      ? CommentStatus.VALIDATED
      : CommentStatus.UNVERIFIED,
    upvotes: comment.upvotes.length,
    upvoted: comment.upvotes.some((upvote) => upvote.userId == userId),
  };
}

export const enum CommentStatus {
  UNVERIFIED = 0,
  VALIDATED = 1,
  DELETED = 2,
  PROCESSING = 3,
}
