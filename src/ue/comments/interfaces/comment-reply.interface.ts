import { CommentStatus } from './comment.interface';
import { Prisma, PrismaClient } from '@prisma/client';
import { omit } from '../../../utils';
import { generateCustomModel } from '../../../prisma/prisma.service';

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

export type UnformattedUECommentReply = Prisma.UECommentGetPayload<typeof REPLY_SELECT_FILTER>;
export type UECommentReply = Omit<
  Prisma.UECommentReplyGetPayload<typeof REPLY_SELECT_FILTER> & {
    status: CommentStatus;
  },
  'deletedAt'
>;

export function generateCustomUECommentReplyModel(prisma: PrismaClient) {
  return generateCustomModel(prisma, 'uECommentReply', REPLY_SELECT_FILTER, formatReply);
}

export function formatReply(reply: UnformattedUECommentReply): UECommentReply {
  return {
    ...omit(reply, 'deletedAt'),
    status: (reply.deletedAt && CommentStatus.DELETED) | CommentStatus.VALIDATED,
  };
}
