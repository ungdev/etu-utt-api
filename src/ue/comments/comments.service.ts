import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RawUserUeSubscription } from 'src/prisma/types';
import UeCommentPostReqDto from './dto/req/ue-comment-post-req.dto';
import CommentReplyReqDto from './dto/req/ue-comment-reply-req.dto';
import UeCommentUpdateReqDto from './dto/req/ue-comment-update-req.dto';
import GetUeCommentsReqDto from './dto/req/ue-get-comments-req.dto';
import { UeCommentReply } from './interfaces/comment-reply.interface';
import { CommentStatus, UeComment } from './interfaces/comment.interface';
import { ConfigModule } from '../../config/config.module';

@Injectable()
export class CommentsService {
  constructor(readonly prisma: PrismaService, readonly config: ConfigModule) {}

  /**
   * Retrieves a page of {@link UeComment} matching the user query
   * @param userId the user fetching the comments. Used to determine if an anonymous comment should include its author
   * @param dto the query parameters of this route
   * @param bypassAnonymousData if true, the author of an anonymous comment will be included in the response (this is the case if the user is a moderator)
   * @returns a page of {@link UeComment} matching the user query
   */
  async getComments(
    userId: string,
    dto: GetUeCommentsReqDto,
    bypassAnonymousData: boolean,
  ): Promise<Pagination<UeComment>> {
    // Use a prisma transaction to execute two requests at once:
    // We fetch a page of comments matching our filters and retrieve the total count of comments matching our filters
    const comments = await this.prisma.ueComment.findMany(
      {
        args: {
          userId: userId,
          includeLastValidatedBody: bypassAnonymousData,
          includeDeletedReplied: bypassAnonymousData,
        },
        where: {
          ue: {
            code: dto.ueCode,
          },
        },
        take: this.config.PAGINATION_PAGE_SIZE,
        skip: ((dto.page ?? 1) - 1) * this.config.PAGINATION_PAGE_SIZE,
      },
      userId,
    );
    const commentCount = await this.prisma.ueComment.count({
      where: { ue: { code: dto.ueCode } },
    });
    // If the user is neither a moderator or the comment author, and the comment is anonymous,
    // we remove the author from the response
    for (const comment of comments)
      if (comment.isAnonymous && !bypassAnonymousData && comment.author?.id !== userId) comment.author = undefined;
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
   * @param userId the user fetching the comments. Used to determine if an anonymous comment should include its author
   * @returns a page of {@link UeComment} matching the user query
   */
  async getCommentFromId(commentId: string, userId: string, isModerator: boolean): Promise<UeComment> {
    const comment = await this.prisma.ueComment.findUnique(
      {
        args: {
          includeDeletedReplied: isModerator,
          includeLastValidatedBody: isModerator,
          userId,
        },
        where: {
          id: commentId,
        },
      },
      userId,
    );
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
    const comment = await this.prisma.withDefaultBehaviour.ueComment.findUnique({
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

  /**
   * Retrieves the last semester done by a user for a given ue
   * @remarks The user must not be null
   * @param userId the user to retrieve semesters of
   * @param ueCode the code of the UE
   * @returns the last semester done by the {@link user} for the {@link ueCode | ue}
   */
  async getLastSemesterDoneByUser(userId: string, ueCode: string): Promise<RawUserUeSubscription> {
    return this.prisma.userUeSubscription.findFirst({
      where: {
        ue: {
          code: ueCode,
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
    const ue = await this.prisma.withDefaultBehaviour.ue.findUnique({
      where: {
        code: ueCode,
      },
    });
    // Find a comment (in the UE) whose author is the user
    const comment = await this.prisma.ueComment.findMany({
      args: {
        includeDeletedReplied: false,
        includeLastValidatedBody: false,
        userId,
      },
      where: {
        authorId: userId,
        ueId: ue.id,
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
    return this.prisma.ueComment.create(
      {
        args: {
          includeDeletedReplied: true,
          includeLastValidatedBody: true,
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
          ue: {
            connect: {
              code: body.ueCode,
            },
          },
          semester: {
            connect: {
              // Use last semester done when creating the comment
              code: (await this.getLastSemesterDoneByUser(userId, body.ueCode)).semesterId,
            },
          },
        },
      },
      userId,
    );
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
    const previousComment = await this.prisma.ueComment.findUnique({
      args: {
        userId,
        includeDeletedReplied: true,
        includeLastValidatedBody: true,
      },
      where: {
        id: commentId,
      },
    });
    const needsValidationAgain =
      body.body &&
      body.body !== previousComment.body &&
      previousComment.status & CommentStatus.VALIDATED &&
      !isModerator;

    return this.prisma.ueComment.update(
      {
        args: {
          userId,
          includeDeletedReplied: true,
          includeLastValidatedBody: true,
        },
        where: {
          id: commentId,
        },
        data: {
          body: body.body,
          isAnonymous: body.isAnonymous,
          validatedAt: needsValidationAgain ? null : undefined,
          lastValidatedBody: needsValidationAgain ? previousComment.body : undefined,
          updatedAt: new Date(),
        },
      },
      userId,
    );
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
  async replyComment(userId: string, commentId: string, reply: CommentReplyReqDto): Promise<UeCommentReply> {
    return this.prisma.ueCommentReply.create({
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
  async editReply(replyId: string, reply: CommentReplyReqDto): Promise<UeCommentReply> {
    return this.prisma.ueCommentReply.update({
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
    return this.prisma.ueCommentReply.update({
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
    return this.prisma.ueComment.update(
      {
        args: {
          userId,
          includeDeletedReplied: true,
          includeLastValidatedBody: false,
        },
        where: {
          id: commentId,
        },
        data: {
          deletedAt: new Date(),
        },
      },
      userId,
    );
  }

  /**
   * Checks whether a comment exists
   * @param commentId the id of the comment to check
   * @returns whether the {@link commentId | comment} exists
   */
  async doesCommentExist(commentId: string, userId: string, includeUnverified: boolean, includeDeleted = false) {
    return (
      (await this.prisma.ueComment.count({
        where: {
          id: commentId,
          deletedAt: includeDeleted ? undefined : null,
          OR: [
            {
              validatedAt: {
                not: null,
              },
              reports: {
                none: {
                  mitigated: false,
                },
              },
            },
            {
              authorId: includeUnverified ? undefined : userId,
            },
          ],
        },
      })) != 0
    );
  }
}
