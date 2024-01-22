import { Prisma } from '@prisma/client';

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
} as const;

type DeepWritable<T> = { -readonly [key in keyof T]: DeepWritable<T[key]> };
export type UERawComment = DeepWritable<Prisma.UECommentGetPayload<typeof COMMENT_SELECT_FILTER>>;
export type UEComment = Omit<UERawComment, 'upvotes'> & {
  upvotes: number;
  upvoted: boolean;
};

export function SelectComment<T>(arg: T): T & typeof COMMENT_SELECT_FILTER {
  return {
    ...arg,
    ...COMMENT_SELECT_FILTER,
  } as const;
}
