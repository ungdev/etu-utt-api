import { Prisma, PrismaClient } from '@prisma/client';
import { RequestType, generateCustomModel } from '../../../prisma/prisma.service';
import { REPLY_SELECT_FILTER, UeCommentReply, formatReply } from './comment-reply.interface';
import { omit } from '../../../utils';
import { RawUeCommentReport } from 'src/prisma/types';

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
    deletedAt: true,
    semester: {
      select: {
        code: true,
      },
    },
    isAnonymous: true,
    body: true,
    ueof: {
      select: {
        code: true,
        info: {
          select: {
            language: true,
          },
        },
      },
    },
    answers: REPLY_SELECT_FILTER,
    upvotes: {
      select: {
        userId: true,
      },
    },
    reports: {
      select: {
        id: true,
        reportedBody: true,
        body: true,
        mitigated: true,
        createdAt: true,
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
          },
        },
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
} satisfies Partial<RequestType<'ueComment'>>;

export type UEExtraArgs = {
  userId: string;
  /**
   * If true this will include deleted comments and deleted replies
   */
  includeDeleted?: boolean;
  /**
   * If true this will include comments reports
   */
  includeReports?: boolean;
  /**
   * If true this will include comments which have been reported and are not yet mitigated by a moderator
   */
  includeHiddenComments?: boolean;
  /**
   * If true the owner of anonymous comments will be included
   */
  bypassAnonymousData?: boolean;
};

export type UeCommentReport = Omit<RawUeCommentReport, 'reason' | 'reasonId' | 'commentId' | 'comment' | 'userId'> & {
  reason: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
};
export type UnformattedUeComment = Prisma.UeCommentGetPayload<typeof COMMENT_SELECT_FILTER>;
export type UeComment = Omit<
  UnformattedUeComment,
  'upvotes' | 'deletedAt' | 'answers' | 'semester' | 'reports' | 'author'
> & {
  upvotes: number;
  upvoted: boolean;
  status: CommentStatus;
  answers: UeCommentReply[];
  semester: string;
  reports: UeCommentReport[];
  author?: UnformattedUeComment['author'];
};

export function generateCustomCommentModel(prisma: PrismaClient) {
  return generateCustomModel(
    prisma,
    'ueComment',
    COMMENT_SELECT_FILTER,
    formatComment,
    async (query, args: UEExtraArgs) => {
      if ('data' in query && !('where' in query)) {
        // CREATE operation → skip where filters
        return query;
      }
      const includeDeleted = !!args.includeDeleted;
      const includeHiddenComments = !!args.includeHiddenComments;
      if (query.where == null && !(includeDeleted && includeHiddenComments)) {
        Object.assign(query, { ...query, where: {} });
      }
      if (!includeDeleted) {
        Object.assign(query.where, { ...query.where, deletedAt: null });
      }
      if (!includeHiddenComments) {
        Object.assign(query.where, { ...query.where, reports: { none: { mitigated: false } } });
      }
      return query;
    },
  );
}

export function formatComment(prisma: PrismaClient, comment: UnformattedUeComment, args: UEExtraArgs): UeComment {
  const bypassAnonymousData = !!args.bypassAnonymousData;
  const includeReports = !!args.includeReports;
  return {
    ...omit(comment, 'deletedAt'),
    author: !comment.isAnonymous || bypassAnonymousData || args.userId == comment.author.id ? comment.author : null,
    answers: comment.answers
      .filter((answer) => args.includeDeleted || answer.deletedAt === null)
      .map((answer) => {
        const anwser = formatReply(prisma, answer);
        if (!includeReports) anwser.reports = [];
        return anwser;
      }),
    status:
      (comment.reports.some((r) => !r.mitigated) && CommentStatus.HIDDEN) |
      (comment.deletedAt && CommentStatus.DELETED),
    upvotes: comment.upvotes.length,
    upvoted: comment.upvotes.some((upvote) => upvote.userId == args.userId),
    semester: comment.semester.code,
    reports: includeReports ? comment.reports.map((r) => ({ ...r, reason: r.reason.name })) : [],
  };
}

export const enum CommentStatus {
  ACTIVE = 0b00,
  /**
   * The comment has been reported and is temporarily hidden
   */
  HIDDEN = 0b01,
  DELETED = 0b10,
}
