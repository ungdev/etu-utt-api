import { Injectable } from '@nestjs/common';
import { UESearchDto } from './dto/ue-search.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { UeCommentPostDto } from './dto/ue-comment-post.dto';
import { UERateDto } from './dto/ue-rate.dto';
import { UeCommentUpdateDto } from './dto/ue-comment-update.dto';
import { CommentReplyDto } from './dto/ue-comment-reply.dto';
import { GetUECommentsDto } from './dto/ue-get-comments.dto';
import { SelectUEOverview, UEOverView } from './interfaces/ue-overview.interface';
import { FormatUEDetail, SelectUEDetail, UEDetail } from './interfaces/ue-detail.interface';
import { FormatComment, SelectComment, UEComment } from './interfaces/comment.interface';
import { FormatReply, SelectCommentReply, UECommentReply } from './interfaces/comment-reply.interface';
import { Criterion, SelectCriterion } from './interfaces/criterion.interface';
import { SelectRate, UERating } from './interfaces/rate.interface';
import { RawUserUESubscription } from '../prisma/types';

@Injectable()
export class UEService {
  constructor(readonly prisma: PrismaService, readonly config: ConfigService) {}

  /**
   * Retrieves a page of {@link UEOverView} matching the user query. This query searchs for a text in
   * the ue code, name, comment, objectives and program. The user can restrict his research to a branch,
   * a filiere, a credit type or a semester.
   * @param query the query parameters of this route
   * @returns a page of {@link UEOverView} matching the user query
   */
  async searchUEs(query: UESearchDto): Promise<Pagination<UEOverView>> {
    // The where query object for prisma
    const where = {
      // Search for the user query (if there is one)
      // We're using this syntax because of the behavior of the OR operator :
      // it requires one of the conditions to be fullfilled but if query.q is undefined,
      // all conditions will be ignored.
      ...(query.q
        ? {
            OR: [
              {
                code: {
                  contains: query.q,
                },
              },
              {
                inscriptionCode: {
                  contains: query.q,
                },
              },
              {
                name: {
                  contains: query.q,
                },
              },
              {
                info: {
                  OR: [{ comment: query.q }, { objectives: query.q }, { program: query.q }],
                },
              },
            ],
          }
        : {}),
      // Filter per branch option and branch if such a filter is present
      ...(query.branchOption || query.branch
        ? {
            branchOption: {
              some: {
                OR: [
                  { code: query.branchOption },
                  {
                    branch: {
                      code: query.branch,
                    },
                  },
                ],
              },
            },
          }
        : {}),
      // Filter per credit type
      credits: {
        some: {
          category: {
            code: query.creditType,
          },
        },
      },
      // Filter per semester
      openSemester: {
        some: {
          code: query.availableAtSemester?.toUpperCase(),
        },
      },
    };
    // Use a prisma transaction to execute two requests at once:
    // We fetch a page of items matching our filters and retrieve the total count of items matching our filters
    const [items, itemCount] = await this.prisma.$transaction([
      this.prisma.uE.findMany(
        SelectUEOverview({
          where,
          take: Number(this.config.get('PAGINATION_PAGE_SIZE')),
          skip: ((query.page ?? 1) - 1) * Number(this.config.get<number>('PAGINATION_PAGE_SIZE')),
          orderBy: {
            code: 'asc',
          },
        }),
      ),
      this.prisma.uE.count({ where }),
    ]);
    // Data pagination
    return {
      items,
      itemCount,
      itemsPerPage: Number(this.config.get('PAGINATION_PAGE_SIZE')),
    };
  }

  /**
   * Retrieves a {@link UEDetail}
   * @remarks The ue must exist
   * @param code the code of the ue to retrieve
   * @returns the {@link UEDetail} of the ue matching the given code
   */
  async getUE(code: string): Promise<UEDetail> {
    // Fetch an ue from the database and formats it
    return FormatUEDetail(
      await this.prisma.uE.findUnique(
        SelectUEDetail({
          where: {
            code,
          },
        }),
      ),
    );
  }

  /**
   * Retrieves a page of {@link UEComment} matching the user query
   * @param ueCode the code of the UE
   * @param userId the user fetching the comments. Used to determine if an anonymous comment should include its author
   * @param dto the query parameters of this route
   * @param bypassAnonymousData if true, the author of an anonymous comment will be included in the response (this is the case if the user is a moderator)
   * @returns a page of {@link UEComment} matching the user query
   */
  async getComments(
    ueCode: string,
    userId: string,
    dto: GetUECommentsDto,
    bypassAnonymousData: boolean,
    includeDeletedAndUnverified: boolean,
  ): Promise<Pagination<UEComment>> {
    // Use a prisma transaction to execute two requests at once:
    // We fetch a page of comments matching our filters and retrieve the total count of comments matching our filters
    const [comments, commentCount] = await this.prisma.$transaction([
      this.prisma.uEComment.findMany(
        SelectComment(
          {
            where: {
              ue: {
                code: ueCode,
              },
              deletedAt: includeDeletedAndUnverified ? undefined : null,
              OR: [
                {
                  reports: {
                    none: {
                      mitigated: false,
                    },
                  },
                  validatedAt: {
                    // If `includeDeletedAndUnverified` is true, condition is ignored as we're using the value undefined
                    // Check https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/null-and-undefined#the-effect-of-null-and-undefined-on-conditionals
                    // for more details
                    not: includeDeletedAndUnverified ? undefined : null,
                  },
                },
                {
                  authorId: includeDeletedAndUnverified ? undefined : userId,
                },
              ],
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
            take: Number(this.config.get('PAGINATION_PAGE_SIZE')),
            skip: ((dto.page ?? 1) - 1) * Number(this.config.get('PAGINATION_PAGE_SIZE')),
          },
          userId,
          ueCode,
          includeDeletedAndUnverified,
          includeDeletedAndUnverified,
          includeDeletedAndUnverified,
        ),
      ),
      this.prisma.uEComment.count({
        where: { ue: { code: ueCode } },
      }),
    ]);
    // If the user is neither a moderator or the comment author, and the comment is anonymous,
    // we remove the author from the response
    for (const comment of comments)
      if (comment.isAnonymous && !bypassAnonymousData && comment.author?.id !== userId) delete comment.author;
    // Data pagination
    return {
      items: comments.map((comment) => FormatComment(comment, userId)),
      itemCount: commentCount,
      itemsPerPage: Number(this.config.get('PAGINATION_PAGE_SIZE')),
    };
  }

  /**
   * Checks whether a user is the author of a comment
   * @remarks The comment must exist and user must not be null
   * @param userId the user to check
   * @param commentId the comment to check
   * @returns whether the user is the author of the {@link commentId | comment}
   */
  async isUserCommentAuthor(userId: string, commentId: string) {
    const comment = await this.prisma.uEComment.findUnique({
      where: {
        id: commentId,
        deletedAt: null,
      },
    });
    return comment.authorId == userId;
  }

  /**
   * Checks whether a reply exists
   * @param replyId the id of the reply to check
   * @returns whether the {@link replyId | reply} exists
   */
  async doesReplyExist(replyId: string, userId: string, includeDeleted: boolean): Promise<boolean> {
    return (
      (await this.prisma.uECommentReply.count({
        where: {
          id: replyId,
          deletedAt: includeDeleted ? undefined : null,
          OR: [
            {
              reports: {
                none: {
                  mitigated: false,
                },
              },
            },
            {
              authorId: includeDeleted ? undefined : userId,
            },
          ],
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
          deletedAt: null,
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
   * Checks whether an ue exists
   * @param ueCode the code of the ue to check
   * @returns whether the ue exists
   */
  async doesUEExist(ueCode: string) {
    return (
      (await this.prisma.uE.count({
        where: {
          code: ueCode,
        },
      })) != 0
    );
  }

  /**
   * Checks whether a user has already done an ue
   * @remarks The user must not be null
   * @param userId the user to check
   * @param ueCode the code of the ue to check
   * @returns whether the {@link user} has already done the {@link ueCode | ue}
   */
  async hasAlreadyDoneThisUE(userId: string, ueCode: string) {
    return (await this.getLastSemesterDoneByUser(userId, ueCode)) != null;
  }

  async hasDoneThisUEInSemester(userId: string, ueCode: string, semesterCode: string) {
    return (
      (await this.prisma.userUESubscription.count({
        where: {
          semesterId: semesterCode,
          ue: {
            code: ueCode,
          },
          userId,
        },
      })) != 0
    );
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
    const ue = await this.prisma.uE.findUnique({
      where: {
        code: ueCode,
      },
    });
    // Find a comment (in the UE) whoose author is the user
    const comment = await this.prisma.uEComment.findFirst({
      where: {
        authorId: userId,
        ueId: ue.id,
        deletedAt: null,
      },
    });
    return comment != null;
  }

  /**
   * Creates a comment for an ue
   * @remarks The user must not be null and UE must exist
   * @param body the body of the request
   * @param userId the user posting the comment
   * @param ueCode the code of the ue to post the comment to
   * @returns the created {@link UEComment}
   */
  async createComment(body: UeCommentPostDto, userId: string, ueCode: string): Promise<UEComment> {
    return FormatComment(
      await this.prisma.uEComment.create(
        SelectComment(
          {
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
                  code: ueCode,
                },
              },
              semester: {
                connect: {
                  // Use last semester done when creating the comment
                  code: (await this.getLastSemesterDoneByUser(userId, ueCode)).semesterId,
                },
              },
            },
          },
          userId,
          ueCode,
          true,
          true,
        ),
      ),
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
      where: {
        id: commentId,
      },
      include: {
        ue: true,
      },
    });
    const needsValidationAgain =
      body.body && body.body !== previousComment.body && previousComment.validatedAt != null && !isModerator;
    return FormatComment(
      await this.prisma.uEComment.update(
        SelectComment(
          {
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
          previousComment.ue.code,
          true,
          true,
          isModerator,
        ),
      ),
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

  /**
   * Creates a reply to a comment
   * @remarks The user must not be null and the comment must exist
   * @param userId the user posting the reply
   * @param commentId the id of the comment to reply to
   * @param reply the reply to post
   * @returns the created {@link UECommentReply}
   */
  async replyComment(userId: string, commentId: string, reply: CommentReplyDto): Promise<UECommentReply> {
    return FormatReply(
      await this.prisma.uECommentReply.create(
        SelectCommentReply({
          data: {
            body: reply.body,
            commentId,
            authorId: userId,
          },
        }),
      ),
    );
  }

  /**
   * Updates a reply
   * @remarks The {@link replyId | reply} must exist
   * @param replyId the id of the reply to edit
   * @param reply the modifications to apply to the reply
   * @returns the updated {@link UECommentReply}
   */
  async editReply(replyId: string, reply: CommentReplyDto): Promise<UECommentReply> {
    return FormatReply(
      await this.prisma.uECommentReply.update(
        SelectCommentReply({
          data: {
            body: reply.body,
            updatedAt: new Date(),
          },
          where: {
            id: replyId,
          },
        }),
      ),
    );
  }

  /**
   * Deletes a reply
   * @remarks The {@link replyId | reply} must exist
   * @param replyId the id of the reply to delete
   * @returns the deleted {@link UECommentReply}
   */
  async deleteReply(replyId: string): Promise<UECommentReply> {
    return FormatReply(
      await this.prisma.uECommentReply.update(
        SelectCommentReply({
          where: {
            id: replyId,
          },
          data: {
            deletedAt: new Date(),
          },
        }),
      ),
    );
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
  async deleteComment(commentId: string, userId: string, isModerator: boolean): Promise<UEComment> {
    const comment = await this.prisma.uEComment.findUnique({
      where: {
        id: commentId,
      },
      select: {
        ue: {
          select: {
            code: true,
          },
        },
      },
    });
    return FormatComment(
      await this.prisma.uEComment.update(
        SelectComment(
          {
            where: {
              id: commentId,
            },
            data: {
              deletedAt: new Date(),
            },
          },
          userId,
          comment.ue.code,
          true,
          true,
          isModerator,
        ),
      ),
      userId,
    );
  }

  /**
   * Checks whether a criterion exists
   * @param criterionId the id of the criterion to check
   * @returns whether the {@link criterionId | criterion} exists
   */
  async doesCriterionExist(criterionId: string) {
    return (
      (await this.prisma.uEStarCriterion.count({
        where: {
          id: criterionId,
        },
      })) != 0
    );
  }

  async hasAlreadyRated(userId: string, ueCode: string, criterionId: string) {
    return (
      (await this.prisma.uEStarVote.count({
        where: {
          ue: {
            code: ueCode,
          },
          userId,
          criterionId,
        },
      })) != 0
    );
  }

  /**
   * Retrieves a list of all available criteria
   * @returns the list of all criteria
   */
  async getRateCriteria(): Promise<Criterion[]> {
    return this.prisma.uEStarCriterion.findMany(
      SelectCriterion({
        orderBy: {
          name: 'asc',
        },
      }),
    );
  }

  /**
   * Retrieves the user ratings of a given ue
   * @remarks The user must not be null and the ue must exist
   * @param userId the user fetching his ratings
   * @param ueCode the code of the ue to fetch the rates of
   * @returns the rates of the {@link ueCode | ue} for the {@link user}
   */
  async getRateUE(userId: string, ueCode: string): Promise<UERating[]> {
    const UE = await this.prisma.uE.findUnique({
      where: {
        code: ueCode,
      },
    });
    return this.prisma.uEStarVote.findMany(
      SelectRate({
        where: {
          userId: userId,
          ueId: UE.id,
        },
        orderBy: {
          criterion: {
            name: 'asc',
          },
        },
      }),
    );
  }

  /**
   * Creates or updates a rating for a given ue
   * @remarks The user must not be null and the ue must exist
   * @param userId the user rating the ue
   * @param ueCode the code of the ue to rate
   * @param dto the rating to apply
   * @returns the new rate of the {@link ueCode | ue} for the {@link user}
   */
  async doRateUE(userId: string, ueCode: string, dto: UERateDto): Promise<UERating> {
    const UE = await this.prisma.uE.findUnique({
      where: {
        code: ueCode,
      },
    });
    return this.prisma.uEStarVote.upsert(
      SelectRate({
        where: {
          ueId_userId_criterionId: {
            ueId: UE.id,
            userId,
            criterionId: dto.criterion,
          },
        },
        create: {
          value: dto.value,
          criterionId: dto.criterion,
          ueId: UE.id,
          userId,
        },
        update: {
          value: dto.value,
        },
      }),
    );
  }

  async unRateUE(userId: string, ueCode: string, criterionId: string) {
    const ue = await this.prisma.uE.findUnique({ where: { code: ueCode } });
    return this.prisma.uEStarVote.delete(
      SelectRate({
        where: {
          ueId_userId_criterionId: {
            ueId: ue.id,
            userId,
            criterionId,
          },
        },
      }),
    );
  }
}
