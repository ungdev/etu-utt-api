import { Injectable } from '@nestjs/common';
import { UESearchDto } from './dto/ue-search.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { UeCommentPostDto } from './dto/ue-comment-post.dto';
import { User } from '../prisma/types';
import { UERateDto } from './dto/ue-rate.dto';
import { UeCommentUpdateDto } from './dto/ue-comment-update.dto';
import { CommentReplyDto } from './dto/ue-comment-reply.dto';
import { GetUECommentsDto } from './dto/ue-get-comments.dto';
import {
  SelectUEOverview,
  UEOverView,
} from './interfaces/ue-overview.interface';
import { SelectUEDetail, UEDetail } from './interfaces/ue-detail.interface';
import {
  SelectComment,
  UEComment,
  UERawComment,
} from './interfaces/comment.interface';
import {
  SelectCommentReply,
  UECommentReply,
} from './interfaces/comment-reply.interface';
import { Criterion, SelectCriterion } from './interfaces/criterion.interface';
import { SelectRate, UERating } from './interfaces/rate.interface';

@Injectable()
export class UEService {
  constructor(readonly prisma: PrismaService, readonly config: ConfigService) {}

  /**
   * Retrieves a page of {@link UEOverView} matching the user query. This query searchs for a text in
   * the ue code, name, comment, objectives and programme. The user can restrict his research to a branch,
   * a filiere, a credit type or a semester.
   * @param query the query parameters of this route
   * @returns a page of {@link UEOverView} matching the user query
   */
  async searchUEs(query: UESearchDto): Promise<Pagination<UEOverView>> {
    // The where query object for prisma
    const where = {
      // Search for the user query (if there is one)
      // We're using this syntax not to have the `null` value in our filters
      // because prisma handled `null` and `undefined` differently (only `undefined`
      // is ignored whereas `null` matches the sql NULL value)
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
                  OR: [
                    { comment: query.q },
                    { objectives: query.q },
                    { programme: query.q },
                  ],
                },
              },
            ],
          }
        : {}),
      // Filter per filiere and branch if such a filter is present
      ...(query.filiere || query.branch
        ? {
            filiere: {
              some: {
                OR: [
                  { code: query.filiere },
                  {
                    branche: {
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
          skip:
            ((query.page ?? 1) - 1) *
            Number(this.config.get<number>('PAGINATION_PAGE_SIZE')),
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
    // Fetch an ue from the database. This ue shall not be returned as is because
    // it is not formatted at that point.
    const ue = await this.prisma.uE.findUnique(
      SelectUEDetail({
        where: {
          code,
        },
      }),
    );
    // We store rates in a object where the key is the criterion id and the value is a list ratings
    const starVoteCriteria: {
      [key: string]: {
        createdAt: Date;
        value: number;
      }[];
    } = {};
    for (const starVote of ue.starVotes) {
      if (starVote.criterionId in starVoteCriteria)
        starVoteCriteria[starVote.criterionId].push({
          createdAt: starVote.createdAt,
          value: starVote.value,
        });
      else
        starVoteCriteria[starVote.criterionId] = [
          {
            createdAt: starVote.createdAt,
            value: starVote.value,
          },
        ];
    }
    // Compute ratings for each criterion, using an exponential decay function
    // And turn semester into their respective code.
    return {
      ...ue,
      openSemester: ue.openSemester.map((semester) => semester.code),
      starVotes: Object.fromEntries(
        Object.entries(starVoteCriteria).map(([key, entry]) => {
          let coefficients = 0;
          let ponderation = 0;
          for (const { value, createdAt } of entry) {
            const dt =
              (starVoteCriteria[key][0].createdAt.getTime() -
                createdAt.getTime()) /
              1000;
            const dp = Math.exp(-dt / 10e7);
            ponderation += dp * value;
            coefficients += dp;
          }
          return [key, Math.round((ponderation / coefficients) * 10) / 10];
        }),
      ),
    };
  }

  /**
   * Retrieves a page of {@link UEComment} matching the user query
   * @param ueCode the code of the UE
   * @param user the user fetching the comments. Used to determine if an anonymous comment should include its author
   * @param dto the query parameters of this route
   * @param bypassAnonymousData if true, the author of an anonymous comment will be included in the response (this is the case if the user is a moderator)
   * @returns a page of {@link UEComment} matching the user query
   */
  async getComments(
    ueCode: string,
    user: User,
    dto: GetUECommentsDto,
    bypassAnonymousData: boolean,
  ): Promise<Pagination<UEComment>> {
    // Use a prisma transaction to execute two requests at once:
    // We fetch a page of comments matching our filters and retrieve the total count of comments matching our filters
    const [comments, commentCount] = (await this.prisma.$transaction([
      this.prisma.uEComment.findMany(
        SelectComment({
          where: {
            UE: {
              code: ueCode,
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
          take: Number(this.config.get('PAGINATION_PAGE_SIZE')),
          skip:
            ((dto.page ?? 1) - 1) *
            Number(this.config.get('PAGINATION_PAGE_SIZE')),
        }),
      ),
      this.prisma.uEComment.count({
        where: { UE: { code: ueCode } },
      }),
    ])) as [UERawComment[], number];
    // If the user is neither a moderator or the comment author, and the comment is anonymous,
    // we remove the author from the response
    for (const comment of comments)
      if (
        comment.isAnonymous &&
        !bypassAnonymousData &&
        comment.author.id !== user.id
      )
        delete comment.author;
    // Data pagination
    return {
      items: comments.map((comment) => ({
        ...comment,
        upvotes: comment.upvotes.length,
        upvoted: comment.upvotes.some((upvote) => upvote.userId == user.id),
      })),
      itemCount: commentCount,
      itemsPerPage: Number(this.config.get('PAGINATION_PAGE_SIZE')),
    };
  }

  /**
   * Checks whether a user is the author of a comment
   * @remarks The comment must exist and user must not be null
   * @param user the user to check
   * @param commentId the comment to check
   * @returns whether the {@link user} is the author of the {@link commentId | comment}
   */
  async isUserCommentAuthor(user: User, commentId: string) {
    const comment = await this.prisma.uEComment.findUnique({
      where: {
        id: commentId,
      },
    });
    return comment.authorId == user.id;
  }

  /**
   * Checks whether a reply exists
   * @param replyId the id of the reply to check
   * @returns whether the {@link replyId | reply} exists
   */
  async doesReplyExist(replyId: string) {
    return !!(await this.prisma.uECommentReply.findUnique({
      where: {
        id: replyId,
      },
    }));
  }

  /**
   * Checks whether a user is the author of a reply
   * @remarks The reply must exist and user must not be null
   * @param user the user to check
   * @param replyId the reply to check
   * @returns whether the {@link user} is the author of the {@link replyId | reply}
   */
  async isUserCommentReplyAuthor(user: User, replyId: string) {
    const reply = await this.prisma.uECommentReply.findUnique({
      where: {
        id: replyId,
      },
    });
    return reply.authorId == user.id;
  }

  /**
   * Retrieves the last semester done by a user for a given ue
   * @remarks The user must not be null
   * @param user the user to retrieve semesters of
   * @param ueCode the code of the UE
   * @returns the last semester done by the {@link user} for the {@link ueCode | ue}
   */
  async getLastSemesterDoneByUser(user: User, ueCode: string) {
    const semester = await this.prisma.userUESubscription.findMany({
      where: {
        UE: {
          code: ueCode,
        },
        userId: user.id,
      },
    });
    // Sort semester by year then by semester type. Pick the last one (ie. first one in the array)
    return semester.sort((a, b) => {
      const diff =
        Number(b.semesterId.slice(1)) - Number(a.semesterId.slice(1));
      return diff == 0 ? a.semesterId.localeCompare(b.semesterId) : diff;
    })[0];
  }

  /**
   * Checks whether an ue exists
   * @param ueCode the code of the ue to check
   * @returns whether the ue exists
   */
  async doesUEExist(ueCode: string) {
    return !!(await this.prisma.uE.findUnique({
      where: {
        code: ueCode,
      },
    }));
  }

  /**
   * Checks whether a user has already done an ue
   * @remarks The user must not be null
   * @param user the user to check
   * @param ueCode the code of the ue to check
   * @returns whether the {@link user} has already done the {@link ueCode | ue}
   */
  async hasAlreadyDoneThisUE(user: User, ueCode: string) {
    return (await this.getLastSemesterDoneByUser(user, ueCode)) != null;
  }

  /**
   * Checks whether a user has already posted a comment for an ue
   * @remarks The user must not be null and UE must exist
   * @param user the user to check
   * @param ueCode the code of the ue to check
   * @returns whether the {@link user} has already posted a comment for the {@link ueCode | ue}
   */
  async hasAlreadyPostedAComment(user: User, ueCode: string) {
    // Find the UE
    const ue = await this.prisma.uE.findUnique({
      where: {
        code: ueCode,
      },
    });
    // Find a comment (in the UE) whoose author is the user
    const comment = await this.prisma.uEComment.findUnique({
      where: {
        UEId_authorId: {
          authorId: user.id,
          UEId: ue.id,
        },
      },
    });
    return comment != null;
  }

  /**
   * Creates a comment for an ue
   * @remarks The user must not be null and UE must exist
   * @param body the body of the request
   * @param user the user posting the comment
   * @param ueCode the code of the ue to post the comment to
   * @returns the created {@link UEComment}
   */
  async createComment(
    body: UeCommentPostDto,
    user: User,
    ueCode: string,
  ): Promise<UEComment> {
    return {
      ...(await this.prisma.uEComment.create(
        SelectComment({
          data: {
            body: body.body,
            isAnonymous: body.isAnonymous ?? false,
            updatedAt: new Date(),
            author: {
              connect: {
                id: user.id,
              },
            },
            UE: {
              connect: {
                code: ueCode,
              },
            },
            semester: {
              connect: {
                // Use last semester done when creating the comment
                code: (
                  await this.getLastSemesterDoneByUser(user, ueCode)
                ).semesterId,
              },
            },
          },
        }),
      )),
      // The comment has no upvotes yet
      upvotes: 0,
      upvoted: false,
    };
  }

  /**
   * Updates a comment
   * @remaks The comment must exist and the user must not be null
   * @param body the updates to apply to the comment
   * @param commentId the id of the comment
   * @param user the user updating the comment
   * @returns the updated comment
   */
  async updateComment(
    body: UeCommentUpdateDto,
    commentId: string,
    user: User,
  ): Promise<UEComment> {
    const comment = await this.prisma.uEComment.update(
      SelectComment({
        where: {
          id: commentId,
        },
        data: {
          body: body.body,
          isAnonymous: body.isAnonymous,
        },
      }),
    );
    return {
      ...comment,
      upvotes: comment.upvotes.length,
      upvoted: comment.upvotes.some((upvote) => upvote.userId == user.id),
    };
  }

  /**
   * Checks whether a user has already upvoted a comment
   * @remarks The user must not be null
   * @param user the user to check
   * @param commentId the id of the comment to check
   * @returns whether the {@link user} has already upvoted the {@link commentId | comment}
   */
  async hasAlreadyUpvoted(user: User, commentId: string) {
    const commentUpvote = await this.prisma.uECommentUpvote.findUnique({
      where: {
        userId_commentId: {
          commentId,
          userId: user.id,
        },
      },
    });
    return commentUpvote != null;
  }

  /**
   * Checks whether a comment exists
   * @param commentId the id of the comment to check
   * @returns whether the {@link commentId | comment} exists
   */
  async doesCommentExist(commentId: string) {
    return this.prisma.uEComment.findUnique({
      where: {
        id: commentId,
      },
    });
  }

  /**
   * Creates a reply to a comment
   * @remarks The user must not be null and the comment must exist
   * @param user the user posting the reply
   * @param commentId the id of the comment to reply to
   * @param reply the reply to post
   * @returns the created {@link UECommentReply}
   */
  async replyComment(
    user: User,
    commentId: string,
    reply: CommentReplyDto,
  ): Promise<UECommentReply> {
    return this.prisma.uECommentReply.create(
      SelectCommentReply({
        data: {
          body: reply.body,
          commentId,
          authorId: user.id,
        },
      }),
    );
  }

  /**
   * Updates a reply
   * @remarks The {@link replyId | reply} must exist
   * @param replyId the id of the reply to edit
   * @param reply the modifications to apply to the reply
   * @returns the updated {@link UECommentReply}
   */
  async editReply(
    replyId: string,
    reply: CommentReplyDto,
  ): Promise<UECommentReply> {
    return this.prisma.uECommentReply.update(
      SelectCommentReply({
        data: {
          body: reply.body,
        },
        where: {
          id: replyId,
        },
      }),
    );
  }

  /**
   * Deletes a reply
   * @remarks The {@link replyId | reply} must exist
   * @param replyId the id of the reply to delete
   * @returns the deleted {@link UECommentReply}
   */
  async deleteReply(replyId: string): Promise<UECommentReply> {
    return this.prisma.uECommentReply.delete(
      SelectCommentReply({
        where: {
          id: replyId,
        },
      }),
    );
  }

  /**
   * Upvote a comment for a specific user
   * @remarks The user must not be null and the comment must exist
   * @param user the user upvoting the comment
   * @param commentId the id of the comment to upvote
   */
  async upvoteComment(user: User, commentId: string) {
    await this.prisma.uECommentUpvote.create({
      data: {
        commentId,
        userId: user.id,
      },
    });
  }

  /**
   * Un-upvote a comment for a specific user
   * @remarks The user must not be null and the comment must exist
   * @param user the user un-upvoting the comment
   * @param commentId the id of the comment to un-upvote
   */
  async deUpvoteComment(user: User, commentId: string) {
    await this.prisma.uECommentUpvote.delete({
      where: {
        userId_commentId: {
          commentId,
          userId: user.id,
        },
      },
    });
  }

  /**
   * Deletes a comment
   * @remarks The {@link commentId | comment} must exist
   * @param commentId the if of the comment to delete
   * @param user the user deleting the comment
   * @returns the deleted {@link UEComment}
   */
  async deleteComment(commentId: string, user: User): Promise<UEComment> {
    const comment = await this.prisma.uEComment.delete(
      SelectComment({
        where: {
          id: commentId,
        },
      }),
    );
    return {
      ...comment,
      upvotes: comment.upvotes.length,
      upvoted: comment.upvotes.some((upvote) => upvote.userId == user.id),
    };
  }

  /**
   * Checks whether a criterion exists
   * @param criterionId the id of the criterion to check
   * @returns whether the {@link criterionId | criterion} exists
   */
  async doesCriterionExist(criterionId: string) {
    return !!(await this.prisma.uEStarCriterion.findUnique({
      where: {
        id: criterionId,
      },
    }));
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
   * @param user the user fetching his ratings
   * @param ueCode the code of the ue to fetch the rates of
   * @returns the rates of the {@link ueCode | ue} for the {@link user}
   */
  async getRateUE(user: User, ueCode: string): Promise<UERating[]> {
    const UE = await this.prisma.uE.findUnique({
      where: {
        code: ueCode,
      },
    });
    return this.prisma.uEStarVote.findMany(
      SelectRate({
        where: {
          userId: user.id,
          UEId: UE.id,
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
   * @param user the user rating the ue
   * @param ueCode the code of the ue to rate
   * @param dto the rating to apply
   * @returns the new rate of the {@link ueCode | ue} for the {@link user}
   */
  async doRateUE(
    user: User,
    ueCode: string,
    dto: UERateDto,
  ): Promise<UERating> {
    const UE = await this.prisma.uE.findUnique({
      where: {
        code: ueCode,
      },
    });
    return this.prisma.uEStarVote.upsert(
      SelectRate({
        where: {
          UEId_userId_criterionId: {
            UEId: UE.id,
            userId: user.id,
            criterionId: dto.criterion,
          },
        },
        create: {
          value: dto.value,
          criterionId: dto.criterion,
          UEId: UE.id,
          userId: user.id,
        },
        update: {
          value: dto.value,
        },
      }),
    );
  }
}
