import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RawUserUESubscription } from 'src/prisma/types';
import { UECommentPostDto } from './dto/ue-comment-post.dto';
import { CommentReplyDto } from './dto/ue-comment-reply.dto';
import { UeCommentUpdateDto } from './dto/ue-comment-update.dto';
import { GetUECommentsDto } from './dto/ue-get-comments.dto';
import { UECommentReply } from './interfaces/comment-reply.interface';
import { CommentStatus, UEComment } from './interfaces/comment.interface';
import { ConfigModule } from '../../config/config.module';

@Injectable()
export class CommentsService {
  constructor(readonly prisma: PrismaService, readonly config: ConfigModule) {}

  /**
   * Retrieves a page of {@link UEComment} matching the user query
   * @param userId the user fetching the comments. Used to determine if an anonymous comment should include its author
   * @param dto the query parameters of this route
   * @param bypassAnonymousData if true, the author of an anonymous comment will be included in the response (this is the case if the user is a moderator)
   * @returns a page of {@link UEComment} matching the user query
   */
  async getComments(
    userId: string,
    dto: GetUECommentsDto,
    bypassAnonymousData: boolean,
  ): Promise<Pagination<UEComment>> {
    // Use a prisma transaction to execute two requests at once:
    // We fetch a page of comments matching our filters and retrieve the total count of comments matching our filters
    const comments = await this.prisma.uEComment.findMany(
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
    const commentCount = await this.prisma.uEComment.count({
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
   * Retrieves a single {@link UEComment} from a comment UUID
   * @param commentId the UUID of the comment
   * @param userId the user fetching the comments. Used to determine if an anonymous comment should include its author
   * @returns a page of {@link UEComment} matching the user query
   */
  async getCommentFromId(commentId: string, userId: string, isModerator: boolean): Promise<UEComment> {
    const comment = await this.prisma.uEComment.findUnique(
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
  async isUserCommentAuthor(userId: string, commentId: string, isModerator: boolean): Promise<boolean> {
    const comment = await this.prisma.uEComment.findUnique({
      args: {
        includeDeletedReplied: isModerator,
        includeLastValidatedBody: isModerator,
        userId,
      },
      where: {
        id: commentId,
      },
    });
    return comment.author.id == userId;
  }

  /**
   * Checks whether a reply exists
   * @param replyId the id of the reply to check
   * @returns whether the {@link replyId | reply} exists
   */
  async doesReplyExist(replyId: string): Promise<boolean> {
    return (
      (await this.prisma.uECommentReply.count({
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
      (await this.prisma.uECommentReply.count({
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
  async getLastSemesterDoneByUser(userId: string, ueCode: string): Promise<RawUserUESubscription> {
    return this.prisma.userUESubscription.findFirst({
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
    const ue = await this.prisma.withDefaultBehaviour.uE.findUnique({
      where: {
        code: ueCode,
      },
    });
    // Find a comment (in the UE) whose author is the user
    const comment = await this.prisma.uEComment.findMany({
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
   * @returns the created {@link UEComment}
   */
  async createComment(body: UECommentPostDto, userId: string): Promise<UEComment> {
    return this.prisma.uEComment.create(
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
    body: UeCommentUpdateDto,
    commentId: string,
    userId: string,
    isModerator: boolean,
  ): Promise<UEComment> {
    const previousComment = await this.prisma.uEComment.findUnique({
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

    return this.prisma.uEComment.update(
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
    const commentUpvote = await this.prisma.uECommentUpvote.findFirst({
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
   * @returns the created {@link UECommentReply}
   */
  async replyComment(userId: string, commentId: string, reply: CommentReplyDto): Promise<UECommentReply> {
    return this.prisma.uECommentReply.create({
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
   * @returns the updated {@link UECommentReply}
   */
  async editReply(replyId: string, reply: CommentReplyDto): Promise<UECommentReply> {
    return this.prisma.uECommentReply.update({
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
   * @returns the deleted {@link UECommentReply}
   */
  async deleteReply(replyId: string): Promise<UECommentReply> {
    return this.prisma.uECommentReply.update({
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
    await this.prisma.uECommentUpvote.create({
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
    await this.prisma.uECommentUpvote.deleteMany({
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
   * @returns the deleted {@link UEComment}
   */
  deleteComment(commentId: string, userId: string): Promise<UEComment> {
    return this.prisma.uEComment.update(
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
      (await this.prisma.uEComment.count({
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
