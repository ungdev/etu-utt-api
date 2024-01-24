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

export type UERawComment = DeepWritable<Prisma.UECommentGetPayload<typeof COMMENT_SELECT_FILTER>>;
export type UEComment = Omit<UERawComment, 'upvotes'> & {
  upvotes: number;
  upvoted: boolean;
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
export function SelectComment<T>(arg: T): T & typeof COMMENT_SELECT_FILTER {
  return {
    ...arg,
    ...COMMENT_SELECT_FILTER,
  } as const;
}
