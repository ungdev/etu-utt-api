import { Prisma } from '@prisma/client';
import { omit } from '../../../utils';
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
        UEsSubscriptions: {
          where: {
            ue: {
              code: null,
            },
          },
          select: {
            semesterId: true,
          },
        },
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

type UERawComment = Prisma.UECommentGetPayload<typeof COMMENT_SELECT_FILTER>;
export type UEComment = Omit<UERawComment, 'upvotes' | 'deletedAt' | 'validatedAt' | 'author'> & {
  upvotes: number;
  upvoted: boolean;
  status: CommentStatus;
  answers: UECommentReply[];
  lastValidatedBody?: string | undefined;
  author?: Omit<UERawComment['author'], 'UEsSubscriptions'> & {
    commentValidForSemesters: string[];
  };
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
  ueCode: string,
  includeDeletedReplied = false,
  includeReportedReplies = false,
  includeLastValidatedBody = false,
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
  Object.assign(COMMENT_SELECT_FILTER.select, { lastValidatedBody: includeLastValidatedBody });
  Object.assign(COMMENT_SELECT_FILTER.select.author.select.UEsSubscriptions.where.ue, {
    code: ueCode,
  });
  return {
    ...arg,
    ...COMMENT_SELECT_FILTER,
  } as const;
}

export function FormatComment<T extends Prisma.UECommentGetPayload<typeof COMMENT_SELECT_FILTER>>(
  comment: T,
  userId: string,
): UEComment & Omit<T, 'deletedAt' | 'validatedAt' | 'author'> {
  return {
    ...omit(comment, 'deletedAt', 'validatedAt', 'author'),
    ...(comment.author
      ? {
          author: {
            ...omit(comment.author, 'UEsSubscriptions'),
            commentValidForSemesters: comment.author.UEsSubscriptions.map((sub) => sub.semesterId),
          },
        }
      : {}),
    answers: comment.answers.map(FormatReply),
    status: (comment.deletedAt && CommentStatus.DELETED) | (comment.validatedAt && CommentStatus.VALIDATED),
    upvotes: comment.upvotes.length,
    upvoted: comment.upvotes.some((upvote) => upvote.userId == userId),
  };
}

export const enum CommentStatus {
  UNVERIFIED = 0b000, // For typing only
  VALIDATED = 0b001,
  PROCESSING = 0b010,
  DELETED = 0b100,
}
