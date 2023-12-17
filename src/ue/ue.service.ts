import { Injectable } from '@nestjs/common';
import { UESearchDto } from './dto/ue-search.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { UeCommentPostDto } from './dto/ue-comment-post.dto';
import { User } from '../prisma/types';
import { UERateDto } from './dto/ue-rate.dto';
import { AppException, ERROR_CODE } from '../exceptions';
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

  async searchUEs(query: UESearchDto): Promise<Pagination<UEOverView>> {
    const where = {
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
      credits: {
        some: {
          category: {
            code: query.creditType,
          },
        },
      },
      openSemester: {
        some: {
          code: query.availableAtSemester?.toUpperCase(),
        },
      },
    };
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
    return {
      items,
      itemCount,
      itemsPerPage: Number(this.config.get('PAGINATION_PAGE_SIZE')),
    };
  }

  async getUE(code: string): Promise<UEDetail> {
    const ue = await this.prisma.uE.findUnique(
      SelectUEDetail({
        where: {
          inscriptionCode: code,
        },
      }),
    );
    if (!ue) throw new AppException(ERROR_CODE.NO_SUCH_UE, code);
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
          return [key, ponderation / coefficients];
        }),
      ),
    };
  }

  async getComments(
    ueCode: string,
    user: User,
    dto: GetUECommentsDto,
    bypassAnonymousData = false,
  ): Promise<Pagination<UEComment>> {
    const [comments, commentCount] = (await this.prisma.$transaction([
      this.prisma.uEComment.findMany(
        SelectComment({
          where: {
            UE: {
              inscriptionCode: ueCode,
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
        where: { UE: { inscriptionCode: ueCode } },
      }),
    ])) as [UERawComment[], number];
    for (const comment of comments)
      if (
        comment.isAnonymous &&
        !bypassAnonymousData &&
        comment.author.id !== user.id
      )
        delete comment.author;
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

  async isUserCommentAuthor(user: User, commentId: string) {
    const comment = await this.prisma.uEComment.findUnique({
      where: {
        id: commentId,
      },
    });
    return comment && comment.authorId == user.id;
  }

  async isUserCommentReplyAuthor(user: User, replyId: string) {
    const reply = await this.prisma.uECommentReply.findUnique({
      where: {
        id: replyId,
      },
    });
    return reply && reply.authorId == user.id;
  }

  async getLastSemesterDoneByUser(user: User, ueCode: string) {
    const semester = await this.prisma.userUESubscription.findFirst({
      where: {
        UE: {
          inscriptionCode: ueCode,
        },
        userId: user.id,
      },
    });
    return semester;
  }

  async hasAlreadyDoneThisUE(user: User, ueCode: string) {
    return (await this.getLastSemesterDoneByUser(user, ueCode)) != null;
  }

  async hasAlreadyPostedAComment(user: User, ueCode: string) {
    const ue = await this.prisma.uE.findUnique({
      where: {
        code: ueCode,
      },
    });
    if (!ue) throw new AppException(ERROR_CODE.NO_SUCH_UE);
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
                inscriptionCode: ueCode,
              },
            },
            semester: {
              connect: {
                code: (
                  await this.getLastSemesterDoneByUser(user, ueCode)
                )?.semesterId,
              },
            },
          },
        }),
      )),
      upvotes: 0,
      upvoted: false,
    };
  }

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

  async deleteReply(replyId: string): Promise<UECommentReply> {
    return this.prisma.uECommentReply.delete(
      SelectCommentReply({
        where: {
          id: replyId,
        },
      }),
    );
  }

  async upvoteComment(user: User, commentId: string) {
    await this.prisma.uECommentUpvote.create({
      data: {
        commentId,
        userId: user.id,
      },
    });
  }

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

  async getRateCriteria(): Promise<Criterion[]> {
    return this.prisma.uEStarCriterion.findMany(
      SelectCriterion({
        orderBy: {
          name: 'asc',
        },
      }),
    );
  }

  async getRateUE(user: User, ueCode: string): Promise<UERating[]> {
    const UE = await this.prisma.uE.findUnique({
      where: {
        code: ueCode,
      },
    });
    if (!UE) throw new AppException(ERROR_CODE.NO_SUCH_UE, ueCode);
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
    if (!UE) throw new AppException(ERROR_CODE.NO_SUCH_UE, ueCode);
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
