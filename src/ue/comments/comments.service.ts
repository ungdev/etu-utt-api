import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RawUserUeSubscription } from 'src/prisma/types';
import UeCommentPostReqDto from './dto/req/ue-comment-post-req.dto';
import UeCommentReplyReqDto from './dto/req/ue-comment-reply-req.dto';
import UeCommentUpdateReqDto from './dto/req/ue-comment-update-req.dto';
import GetUeCommentsReqDto from './dto/req/ue-get-comments-req.dto';
import { UeCommentReply } from './interfaces/comment-reply.interface';
import { UeComment } from './interfaces/comment.interface';
import { ConfigModule } from '../../config/config.module';
import UeCommentReportReqDto from './dto/req/ue-comment-report-req.dto';
import GetReportedCommentsReqDto from './dto/req/ue-get-reported-comments-req.dto';
import UeCommentReportResDto from './dto/res/ue-comment-report-res.dto';
import { omit, pick } from '../../utils';
import { Prisma } from '@prisma/client';

@Injectable()
export class CommentsService {
  constructor(
    readonly prisma: PrismaService,
    readonly config: ConfigModule,
  ) {}

  /**
   * Retrieves a page of {@link UeComment} matching the user query
   * @param userId the user fetching the comments. Used to determine if an anonymous comment should include its author
   * @param dto the query parameters of this route
   * @param bypassRestrictedData if true, deleted comments, deleted replies, hidden comments, and anonymous author will be included in the response (only for moderators)
   * @returns a page of {@link UeComment} matching the user query
   */
  async getComments(
    userId: string,
    dto: GetUeCommentsReqDto,
    bypassRestrictedData: boolean,
  ): Promise<Pagination<UeComment>> {
    // We fetch a page of comments matching our filters and retrieve the total count of comments matching our filters
    const comments = await this.prisma.normalize.ueComment.findMany({
      args: {
        userId: userId,
        includeDeleted: bypassRestrictedData,
        includeHiddenComments: bypassRestrictedData,
        includeReports: bypassRestrictedData,
        bypassAnonymousData: bypassRestrictedData,
      },
      where: {
        ueof: {
          ue: {
            code: dto.ueCode,
          },
        },
      },
      take: this.config.PAGINATION_PAGE_SIZE,
      skip: ((dto.page ?? 1) - 1) * this.config.PAGINATION_PAGE_SIZE,
    });
    const commentCount = await this.prisma.ueComment.count({
      where: {
        ueof: { ue: { code: dto.ueCode } },
        deletedAt: bypassRestrictedData ? undefined : null,
        reports: bypassRestrictedData ? undefined : { none: { mitigated: false } },
      },
    });

    // Data pagination
    return {
      items: comments,
      itemCount: commentCount,
      itemsPerPage: this.config.PAGINATION_PAGE_SIZE,
    };
  }

  /**
   * Retrieves a single {@link UeComment} from a comment UUID
   * @param commentId the UUID of the comment
   * @param userId the user fetching the comment. Used to determine if an anonymous comment should include its author
   * @param isModerator if true the user is a moderator
   * @returns a single {@link UeComment} matching the provided UUID
   */
  async getCommentFromId(commentId: string, userId: string, isModerator: boolean): Promise<UeComment> {
    const comment = await this.prisma.normalize.ueComment.findUnique({
      args: {
        userId: userId,
        includeDeleted: isModerator,
        includeHiddenComments: isModerator,
        includeReports: isModerator,
        bypassAnonymousData: isModerator,
      },
      where: {
        id: commentId,
      },
    });
    return comment;
  }

  /**
   * Retrieves a single {@link UeCommentReply} from a reply UUID
   * @param replyId the UUID of the comment reply
   * @returns a single {@link UeCommentReply} matching the provided UUID
   */
  async getReplyFromId(replyId: string): Promise<UeCommentReply> {
    const comment = await this.prisma.normalize.ueCommentReply.findUnique({
      where: {
        id: replyId,
      },
    });
    return comment;
  }

  /**
   * Checks whether a user is the author of a comment
   * @remarks The comment must exist and user must not be null
   * @param userId the user to check
   * @param commentId the comment to check
   * @returns whether the user is the author of the {@link commentId | comment}
   */
  async isUserCommentAuthor(userId: string, commentId: string): Promise<boolean> {
    const comment = await this.prisma.ueComment.findUnique({
      where: { id: commentId },
      select: { authorId: true },
    });
    return comment.authorId == userId;
  }

  /**
   * Checks whether a reply exists
   * @param replyId the id of the reply to check
   * @returns whether the {@link replyId | reply} exists
   */
  async doesReplyExist(replyId: string): Promise<boolean> {
    return (
      (await this.prisma.ueCommentReply.count({
        where: {
          id: replyId,
        },
      })) != 0
    );
  }

  /**
   * Checks whether a user is the author of a reply
   * @remarks The reply must exist and user must not be null
   * @param userId the user to check
   * @param replyId the reply to check
   * @returns whether the user is the author of the {@link replyId | reply}
   */
  async isUserCommentReplyAuthor(userId: string, replyId: string): Promise<boolean> {
    return (
      (await this.prisma.ueCommentReply.count({
        where: {
          id: replyId,
          authorId: userId,
        },
      })) > 0
    );
  }

  //TODO: This function may belongs to another service (users or ue)
  /**
   * Retrieves the last semester done by a user for a given ue
   * @remarks The user must not be null
   * @param userId the user to retrieve semesters of
   * @param ueCode the code of the UE
   * @returns the last semester done by the {@link user} for the {@link ueCode | ue}
   */
  private async getLastUserSubscription(userId: string, ueCode: string): Promise<RawUserUeSubscription> {
    return this.prisma.userUeSubscription.findFirst({
      where: {
        ueof: {
          ueId: ueCode,
        },
        userId,
      },
      orderBy: {
        semester: {
          end: 'desc',
        },
      },
    });
  }

  /**
   * Checks whether a user has already posted a comment for an ue
   * @remarks The user must not be null and UE must exist
   * @param userId the user to check
   * @param ueCode the code of the ue to check
   * @returns whether the {@link user} has already posted a comment for the {@link ueCode | ue}
   */
  async hasAlreadyPostedAComment(userId: string, ueCode: string) {
    // Find the UE
    const ue = await this.prisma.ue.findUnique({
      where: {
        code: ueCode,
      },
    });
    // Find a comment (in the UE) whose author is the user
    const comment = await this.prisma.normalize.ueComment.findMany({
      args: {
        userId,
      },
      where: {
        authorId: userId,
        ueof: {
          ueId: ue.code,
        },
      },
    });
    return comment.length > 0;
  }

  /**
   * Creates a comment for an ue
   * @remarks The user must not be null and UE must exist
   * @param body the body of the request
   * @param userId the user posting the comment
   * @returns the created {@link UeComment}
   */
  async createComment(body: UeCommentPostReqDto, userId: string): Promise<UeComment> {
    // Use last semester done when creating the comment
    const lastSemester = await this.getLastUserSubscription(userId, body.ueCode);
    return this.prisma.normalize.ueComment.create({
      args: {
        userId,
      },
      data: {
        body: body.body,
        isAnonymous: body.isAnonymous ?? false,
        updatedAt: new Date(),
        author: {
          connect: {
            id: userId,
          },
        },
        ueof: {
          connect: {
            code: lastSemester.ueofCode,
          },
        },
        semester: {
          connect: {
            code: lastSemester.semesterId,
          },
        },
      },
    });
  }

  /**
   * Updates a comment
   * @remaks The comment must exist and the user must not be null
   * @param body the updates to apply to the comment
   * @param commentId the id of the comment
   * @param userId the user updating the comment
   * @returns the updated comment
   */
  async updateComment(
    body: UeCommentUpdateReqDto,
    commentId: string,
    userId: string,
    isModerator: boolean,
  ): Promise<UeComment> {
    const previousComment = await this.prisma.normalize.ueComment.findUnique({
      args: {
        userId,
        includeHiddenComments: isModerator,
        includeDeleted: isModerator,
      },
      where: {
        id: commentId,
      },
    });

    return this.prisma.normalize.ueComment.update({
      args: {
        userId,
        includeHiddenComments: isModerator,
        includeDeleted: isModerator,
      },
      where: {
        id: commentId,
      },
      data: {
        body: body.body,
        isAnonymous: body.isAnonymous,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Checks whether a user has already upvoted a comment
   * @remarks The user must not be null
   * @param userId the user to check
   * @param commentId the id of the comment to check
   * @returns whether the user has already upvoted the {@link commentId | comment}
   */
  async hasAlreadyUpvoted(userId: string, commentId: string) {
    const commentUpvote = await this.prisma.ueCommentUpvote.findFirst({
      where: {
        commentId,
        userId,
      },
    });
    return commentUpvote != null;
  }

  /**
   * Creates a reply to a comment
   * @remarks The user must not be null and the comment must exist
   * @param userId the user posting the reply
   * @param commentId the id of the comment to reply to
   * @param reply the reply to post
   * @returns the created {@link UeCommentReply}
   */
  async replyComment(userId: string, commentId: string, reply: UeCommentReplyReqDto): Promise<UeCommentReply> {
    return this.prisma.normalize.ueCommentReply.create({
      data: {
        body: reply.body,
        commentId,
        authorId: userId,
      },
    });
  }

  /**
   * Updates a reply
   * @remarks The {@link replyId | reply} must exist
   * @param replyId the id of the reply to edit
   * @param reply the modifications to apply to the reply
   * @returns the updated {@link UeCommentReply}
   */
  async editReply(replyId: string, reply: UeCommentReplyReqDto): Promise<UeCommentReply> {
    return this.prisma.normalize.ueCommentReply.update({
      data: {
        body: reply.body,
      },
      where: {
        id: replyId,
      },
    });
  }

  /**
   * Deletes a reply
   * @remarks The {@link replyId | reply} must exist
   * @param replyId the id of the reply to delete
   * @returns the deleted {@link UeCommentReply}
   */
  async deleteReply(replyId: string): Promise<UeCommentReply> {
    return this.prisma.normalize.ueCommentReply.update({
      where: {
        id: replyId,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Upvote a comment for a specific user
   * @remarks The user must not be null and the comment must exist
   * @param userId the user upvoting the comment
   * @param commentId the id of the comment to upvote
   */
  async upvoteComment(userId: string, commentId: string) {
    await this.prisma.ueCommentUpvote.create({
      data: {
        commentId,
        userId,
      },
    });
  }

  /**
   * Un-upvote a comment for a specific user
   * @remarks The user must not be null and the comment must exist
   * @param userId the user un-upvoting the comment
   * @param commentId the id of the comment to un-upvote
   */
  async deUpvoteComment(userId: string, commentId: string) {
    await this.prisma.ueCommentUpvote.deleteMany({
      where: {
        commentId,
        userId,
      },
    });
  }

  /**
   * Deletes a comment
   * @remarks The {@link commentId | comment} must exist
   * @param commentId the if of the comment to delete
   * @param userId the user deleting the comment
   * @returns the deleted {@link UeComment}
   */
  deleteComment(commentId: string, userId: string): Promise<UeComment> {
    return this.prisma.normalize.ueComment.update({
      args: {
        userId,
        includeDeleted: true,
        includeHiddenComments: true,
      },
      where: {
        id: commentId,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Checks whether a comment exists
   * @param commentId the id of the comment to check
   * @param isModerator if true the user is a moderator
   * @returns whether the {@link commentId | comment} exists
   */
  async doesCommentExist(commentId: string, userId: string, isModerator: boolean = false) {
    const where: Prisma.UeCommentWhereInput = {
      id: commentId,
    };
    if (!isModerator) {
      where.deletedAt = null;
      where.reports = {
        none: {
          mitigated: false,
        },
      };
    }
    return (await this.prisma.ueComment.count({ where })) != 0;
  }

  /**
   * Retrieves a page of {@link UeComment} having at least one non mitigated report
   * @returns a page of {@link UeComment} matching the user query
   */
  async getCommentsWithReports(userId: string, dto: GetReportedCommentsReqDto): Promise<Pagination<UeComment>> {
    // We fetch a page of comments matching our filters and retrieve the total count of comments matching our filters
    const whereClause: Prisma.UeCommentWhereInput = {
      OR: [
        {
          reports: {
            some: {
              mitigated: false,
            },
          },
        },
        {
          answers: {
            some: {
              reports: {
                some: {
                  mitigated: false,
                },
              },
            },
          },
        },
      ],
    };
    const comments = await this.prisma.normalize.ueComment.findMany({
      args: {
        userId: userId,
        includeDeleted: false,
        includeHiddenComments: true,
        includeReports: true,
        bypassAnonymousData: true,
      },
      where: whereClause,
      take: this.config.PAGINATION_PAGE_SIZE,
      skip: ((dto.page ?? 1) - 1) * this.config.PAGINATION_PAGE_SIZE,
    });
    const commentCount = await this.prisma.ueComment.count({
      where: {
        ...whereClause,
        deletedAt: null,
      },
    });

    // Data pagination
    return {
      items: comments,
      itemCount: commentCount,
      itemsPerPage: this.config.PAGINATION_PAGE_SIZE,
    };
  }

  /**
   * Check if a report  exist
   * @param reportId the id of the report
   * @returns true if it exists
   */
  async doesCommentReportExist(reportId: string): Promise<Boolean> {
    return (await this.prisma.ueCommentReport.count({ where: { id: reportId } })) == 1;
  }

  /**
   * Check if a report  exist
   * @param reportId the id of the report
   * @returns true if it exists
   */
  async doesCommentReplyReportExist(reportId: string): Promise<Boolean> {
    return (await this.prisma.ueCommentReplyReport.count({ where: { id: reportId } })) == 1;
  }

  /**
   * Check if a report reason exist
   * @param reasonName the name of the report reason
   * @returns true if it exists
   */
  async doesReportReasonExist(reasonName: string): Promise<Boolean> {
    return (await this.prisma.ueCommentReportReason.count({ where: { name: reasonName } })) == 1;
  }

  /**
   * Report a comment
   * @param userId the user id of the reporter
   * @param body the report data
   */
  async reportComment(
    userId: string,
    body: UeCommentReportReqDto,
    commentId: string,
    isModerator: boolean,
  ): Promise<UeCommentReportResDto> {
    // How are reasons handled by the front ?
    // Do we need another route to load reasons ?
    const comment = await this.getCommentFromId(commentId, userId, isModerator);
    const report = await this.prisma.ueCommentReport.create({
      data: {
        body: body.body,
        reportedBody: comment.body,
        reason: {
          connect: {
            name: body.reason,
          },
        },
        comment: {
          connect: {
            id: commentId,
          },
        },
        user: {
          connect: {
            id: userId,
          },
        },
      },
      include: {
        user: true,
        reason: true,
      },
    });
    return {
      ...omit(report, 'reason', 'reasonId', 'userId', 'user'),
      reason: report.reason.name,
      user: pick(report.user, 'firstName', 'id', 'lastName', 'studentId'),
    };
  }

  async reportCommentReply(
    userId: string,
    body: UeCommentReportReqDto,
    replyId: string,
    isModerator: boolean,
  ): Promise<UeCommentReportResDto> {
    const reply = await this.getReplyFromId(replyId);
    const report = await this.prisma.ueCommentReplyReport.create({
      data: {
        body: body.body,
        mitigated: false,
        reason: {
          connect: {
            name: body.reason,
          },
        },
        reply: {
          connect: {
            id: replyId,
          },
        },
        user: {
          connect: {
            id: userId,
          },
        },
        reportedBody: reply.body,
      },
      include: {
        user: true,
        reason: true,
      },
    });
    return {
      ...omit(report, 'user'),
      user: pick(report.user, 'firstName', 'id', 'lastName', 'studentId'),
      reason: report.reason.name,
    };
  }

  async mitigateCommentReport(commentId: string, reportId: string) {
    return this.prisma.ueCommentReport.update({
      where: {
        commentId,
        id: reportId,
      },
      data: {
        mitigated: true,
      },
    });
  }

  async mitigateCommentReplyReport(replyId: string, reportId: string) {
    return this.prisma.ueCommentReplyReport.update({
      where: {
        reply: {
          id: replyId,
        },
        id: reportId,
      },
      data: {
        mitigated: true,
      },
    });
  }
}
