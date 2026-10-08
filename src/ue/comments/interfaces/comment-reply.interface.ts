import { CommentStatus } from '@/ue/comments/interfaces/comment.interface.js';
import { Prisma, PrismaClient } from '@/prisma/types.js';
import { omit } from '@/utils.js';
import { generateCustomModel } from '@/prisma/prisma.service.js';

const REPLY_SELECT_FILTER = {
  select: {
    id: true,
    author: {
      select: {
        id: true,
        lastName: true,
        firstName: true,
      },
    },
    body: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
  },
} as const;

type UnformattedUeCommentReply = Prisma.UeCommentGetPayload<typeof REPLY_SELECT_FILTER>;
export type UeCommentReply = Omit<
  Prisma.UeCommentReplyGetPayload<typeof REPLY_SELECT_FILTER> & {
    status: CommentStatus;
  },
  'deletedAt'
>;

export function generateCustomUeCommentReplyModel(prisma: PrismaClient) {
  return generateCustomModel(prisma, 'ueCommentReply', REPLY_SELECT_FILTER, formatReply);
}

export function formatReply(_: PrismaClient, reply: UnformattedUeCommentReply): UeCommentReply {
  return {
    ...omit(reply, 'deletedAt'),
    status: (reply.deletedAt && CommentStatus.DELETED) | CommentStatus.VALIDATED,
  };
}
