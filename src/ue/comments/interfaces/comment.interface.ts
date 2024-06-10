import { Prisma, PrismaClient } from '@prisma/client';
import { RequestType, generateCustomModel } from '../../../prisma/prisma.service';
import { UECommentReply, formatReply } from './comment-reply.interface';
import { omit } from '../../../utils';

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
  orderBy: [
    {
      upvotes: {
        _count: 'desc',
      },
    },
    {
      createdAt: 'desc',
    },
  ],
} satisfies Partial<RequestType<'uEComment'>>;

export type UEExtraArgs = {
  includeDeletedReplied: boolean;
  includeLastValidatedBody: boolean;
  userId: string;
};

export type UnformattedUEComment = Prisma.UECommentGetPayload<typeof COMMENT_SELECT_FILTER>;
export type UEComment = Omit<UnformattedUEComment, 'upvotes' | 'deletedAt' | 'validatedAt' | 'answers'> & {
  upvotes: number;
  upvoted: boolean;
  status: CommentStatus;
  answers: UECommentReply[];
  lastValidatedBody?: string | undefined;
};
export type UECommentWithValidSemesters = UEComment & {
  semesters: string[];
};

export function generateCustomCommentModel(prisma: PrismaClient) {
  return generateCustomModel(
    prisma,
    'uEComment',
    COMMENT_SELECT_FILTER,
    formatComment,
    async (query, args: UEExtraArgs) => {
      Object.assign(query.select.answers, {
        where: {
          deletedAt: args.includeDeletedReplied ? undefined : null,
          OR: [
            {
              reports: {
                none: {
                  mitigated: false,
                },
              },
            },
            {
              authorId: args.includeDeletedReplied ? undefined : args.userId,
            },
          ],
        },
      });
      Object.assign(query.select, { lastValidatedBody: args.includeLastValidatedBody });
      return query;
    },
  );
}

export function formatComment(prisma: PrismaClient, comment: UnformattedUEComment, userId?: string): UEComment {
  return {
    ...omit(comment, 'deletedAt', 'validatedAt'),
    answers: comment.answers.map((answer) => formatReply(prisma, answer)),
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
