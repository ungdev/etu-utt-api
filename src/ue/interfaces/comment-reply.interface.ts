import { Prisma, PrismaClient } from '@prisma/client';
import { generateCustomModel } from '../../prisma/prisma.service';

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

export type UECommentReply = Prisma.UECommentReplyGetPayload<typeof REPLY_SELECT_FILTER>;

export function generateCustomUECommentReplyModel(prisma: PrismaClient) {
  return generateCustomModel(prisma, 'uECommentReply', REPLY_SELECT_FILTER, (comment: UECommentReply) => comment);
}
