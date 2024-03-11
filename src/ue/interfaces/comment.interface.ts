import { Prisma, PrismaClient } from '@prisma/client';
import { generateCustomModel, RequestType } from '../../prisma/prisma.service';
import { isArray } from 'class-validator';

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
  const model = generateCustomModel<'uEComment', UnformattedUEComment>(prisma, 'uEComment', COMMENT_SELECT_FILTER);
  const modelWithFormatting: Partial<{
    [K in keyof typeof model]: (typeof model)[K] extends (arg: infer Arg) => Promise<infer R>
      ? (arg: Arg, userId?: string) => R extends any[] ? Promise<UEComment[]> : Promise<UEComment>
      : (typeof model)[K];
  }> = {};
  for (const [key, func] of Object.entries(model)) {
    modelWithFormatting[key] = async (args, userId?: string) =>
      func(args).then((comment: UnformattedUEComment | UnformattedUEComment[]) => {
        if (!comment) return null;
        if (isArray(comment)) {
          return (comment as UnformattedUEComment[]).map((c) => formatComment(c, userId));
        }
        return formatComment(comment as UnformattedUEComment, userId);
      });
  }
  return modelWithFormatting as Required<typeof modelWithFormatting>;
}

export function formatComment(comment: UnformattedUEComment, userId?: string): UEComment {
  return {
    ...comment,
    upvotes: comment.upvotes.length,
    upvoted: userId ? comment.upvotes.some((upvote) => upvote.userId === userId) : undefined,
  };
}
