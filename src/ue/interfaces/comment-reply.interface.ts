import { Prisma } from '@prisma/client';

const REPLY_SELECT_FILTER = {
  select: {
    author: {
      select: {
        lastName: true,
        firstName: true,
      },
    },
    body: true,
    commentId: true,
    createdAt: true,
  },
} as const;

type DeepWritable<T> = { -readonly [key in keyof T]: DeepWritable<T[key]> };
export type UECommentReply = DeepWritable<
  Prisma.UECommentReplyGetPayload<typeof REPLY_SELECT_FILTER>
>;

export function SelectCommentReply<T>(arg: T): T & typeof REPLY_SELECT_FILTER {
  return {
    ...arg,
    ...REPLY_SELECT_FILTER,
  } as const;
}
