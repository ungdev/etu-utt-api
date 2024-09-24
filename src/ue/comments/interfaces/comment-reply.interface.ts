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
