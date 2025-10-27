import { CommentStatus } from './comment.interface';
import { Prisma, PrismaClient } from '@prisma/client';
import { omit } from '../../../utils';
import { generateCustomModel } from '../../../prisma/prisma.service';
import { RawUeCommentReplyReport } from 'src/prisma/types';

export const REPLY_SELECT_FILTER = {
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
    reports: {
      select: {
        id: true,
        body: true,
        mitigated: true,
        createdAt: true,
        reportedBody: true,
        reason: {
          select: {
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true,
          },
        },
      },
    },
  },
} as const;

export type UeCommentReplyReport = Omit<RawUeCommentReplyReport, 'reasonId' | 'userId' | 'replyId'> & {
  reason: string;
  user: {
    id: string;
    studentId: number;
    firstName: string;
    lastName: string;
  };
};
type UnformattedUeCommentReply = Prisma.UeCommentGetPayload<typeof REPLY_SELECT_FILTER>;
export type UeCommentReply = Omit<
  Prisma.UeCommentReplyGetPayload<typeof REPLY_SELECT_FILTER>,
  'deletedAt' | 'reports'
> & {
  status: CommentStatus;
  reports: UeCommentReplyReport[];
};

export function generateCustomUeCommentReplyModel(prisma: PrismaClient) {
  return generateCustomModel(prisma, 'ueCommentReply', REPLY_SELECT_FILTER, formatReply);
}

export function formatReply(_: PrismaClient, reply: UnformattedUeCommentReply): UeCommentReply {
  return {
    ...omit(reply, 'deletedAt', 'reports'),
    reports: reply.reports.map((r) => {
      return { ...r, reason: r.reason.name };
    }),
    status:
      (reply.reports.some((r) => !r.mitigated) && CommentStatus.HIDDEN) | (reply.deletedAt && CommentStatus.DELETED),
  };
}
