import { Prisma, PrismaClient } from '@prisma/client';
import { RequestType, generateCustomModel } from '../../prisma/prisma.service';

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

export type UnformattedUEComment = Prisma.UECommentGetPayload<typeof COMMENT_SELECT_FILTER>;
export type UEComment = Omit<UnformattedUEComment, 'upvotes'> & {
  upvotes: number;
  upvoted: boolean;
};

export function generateCustomCommentModel(prisma: PrismaClient) {
  return generateCustomModel(prisma, 'uEComment', COMMENT_SELECT_FILTER, formatComment);
}

export function formatComment(comment: UnformattedUEComment, userId?: string): UEComment {
  return {
    ...comment,
    upvotes: comment.upvotes.length,
    upvoted: userId ? comment.upvotes.some((upvote) => upvote.userId === userId) : undefined,
  };
}
