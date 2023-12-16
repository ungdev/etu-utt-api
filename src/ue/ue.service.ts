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

@Injectable()
export class UEService {
  constructor(readonly prisma: PrismaService, readonly config: ConfigService) {}

  async searchUEs(query: UESearchDto) {
    return this.prisma.uE.findMany({
      where: {
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
        filiere: {
          some: {
            OR: [
              { code: query.filliere },
              {
                branche: {
                  code: query.filliere,
                },
              },
            ],
          },
        },
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
      },
      take: Number(this.config.get('PAGINATION_PAGE_SIZE')),
      skip:
        ((query.page ?? 1) - 1) *
        Number(this.config.get<number>('PAGINATION_PAGE_SIZE')),
      orderBy: {
        code: 'asc',
      },
      select: {
        code: true,
        inscriptionCode: true,
        name: true,
        credits: true,
        filiere: true,
        info: true,
        openSemester: true,
      },
    });
  }

  async getUE(code: string) {
    const ue = await this.prisma.uE.findUnique({
      where: {
        inscriptionCode: code,
      },
      include: {
        credits: {
          include: {
            category: true,
          },
        },
        filiere: {
          include: {
            branche: true,
          },
        },
        info: true,
        openSemester: true,
        starVotes: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        workTime: true,
      },
    });
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
      code: ue.code,
      inscriptionCode: ue.inscriptionCode,
      name: ue.name,
      validationRate: ue.validationRate,
      info: {
        antecedent: ue.info.antecedent,
        comment: ue.info.comment,
        degree: ue.info.degree,
        languages: ue.info.languages,
        minors: ue.info.minors,
        objectives: ue.info.objectives,
        programme: ue.info.programme,
      },
      openSemesters: ue.openSemester.map((semester) => semester.code),
      workTime: {
        cm: ue.workTime.cm,
        td: ue.workTime.td,
        tp: ue.workTime.tp,
        project: ue.workTime.projet,
        the: ue.workTime.the,
        internship: ue.workTime.internship,
      },
      filieres: ue.filiere.map((filiere) => ({
        code: filiere.code,
        name: filiere.name,
        branch: filiere.branche.code,
        branchName: filiere.branche.name,
      })),
      credits: ue.credits.map((credit) => ({
        count: credit.credits,
        category: credit.category.code,
        categoryName: credit.category.name,
      })),
      starVotes: Object.entries(starVoteCriteria).map(([key, entry]) => {
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
    };
  }

  async getComments(
    ueCode: string,
    user: User,
    dto: GetUECommentsDto,
    bypassAnonymousData = false,
  ) {
    const comments = await this.prisma.uEComment.findMany({
      where: {
        UE: {
          inscriptionCode: ueCode,
        },
      },
      select: {
        id: true,
        author: {
          select: {
            firstName: true,
            lastName: true,
            studentId: true,
          },
        },
        createdAt: true,
        updatedAt: true,
        semester: {
          select: {
            code: true,
          },
        },
        isAnonymous: true,
        body: true,
        answers: {
          select: {
            author: {
              select: {
                firstName: true,
                lastName: true,
                studentId: true,
              },
            },
            body: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        upvotes: {
          select: {
            userId: true,
          },
        },
      },
      orderBy: {
        upvotes: {
          _count: 'desc',
        },
        createdAt: 'desc',
      },
      take: Number(this.config.get('PAGINATION_PAGE_SIZE')),
      skip:
        ((dto.page ?? 1) - 1) * Number(this.config.get('PAGINATION_PAGE_SIZE')),
    });
    for (const comment of comments)
      if (comment.isAnonymous && !bypassAnonymousData) delete comment.author;
    return comments.map((comment) => ({
      ...comment,
      upvotes: comment.upvotes.length,
      upvoted: comment.upvotes.some((upvote) => upvote.userId == user.id),
    }));
  }

  async isUserCommentAuthor(user: User, commentId: string) {
    const comment = await this.prisma.uEComment.findUnique({
      where: {
        id: commentId,
      },
    });
    return comment.authorId == user.id;
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

  async createComment(body: UeCommentPostDto, user: User, ueCode: string) {
    return this.prisma.uEComment.create({
      data: {
        body: body.body,
        isAnonymous: body.isAnonymous,
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
            code: (await this.getLastSemesterDoneByUser(user, ueCode))
              ?.semesterId,
          },
        },
      },
      select: {
        id: true,
      },
    });
  }

  async updateComment(body: UeCommentUpdateDto, commentId: string) {
    return this.prisma.uEComment.update({
      where: {
        id: commentId,
      },
      data: {
        body: body.body,
        isAnonymous: body.isAnonymous,
      },
    });
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

  async replyComment(user: User, commentId: string, reply: CommentReplyDto) {
    return this.prisma.uECommentReply.create({
      data: {
        body: reply.body,
        commentId,
        authorId: user.id,
      },
    });
  }

  async upvoteComment(user: User, commentId: string) {
    return this.prisma.uECommentUpvote.create({
      data: {
        commentId,
        userId: user.id,
      },
    });
  }

  async deUpvoteComment(user: User, commentId: string) {
    return this.prisma.uECommentUpvote.delete({
      where: {
        userId_commentId: {
          commentId,
          userId: user.id,
        },
      },
    });
  }

  async deleteComment(commentId: string) {
    return this.prisma.uEComment.delete({
      where: {
        id: commentId,
      },
    });
  }

  async getRateCriteria() {
    return this.prisma.uEStarCriterion.findMany({
      select: {
        id: true,
        name: true,
      },
    });
  }

  async getRateUE(user: User, ueCode: string) {
    const UE = await this.prisma.uE.findUnique({
      where: {
        code: ueCode,
      },
    });
    if (!UE) throw new AppException(ERROR_CODE.NO_SUCH_UE, ueCode);
    return this.prisma.uEStarVote.findMany({
      where: {
        userId: user.id,
        UEId: UE.id,
      },
      select: {
        criterionId: true,
        value: true,
      },
    });
  }

  async doRateUE(user: User, ueCode: string, dto: UERateDto) {
    const UE = await this.prisma.uE.findUnique({
      where: {
        code: ueCode,
      },
    });
    if (!UE) throw new AppException(ERROR_CODE.NO_SUCH_UE, ueCode);
    return this.prisma.uEStarVote.upsert({
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
    });
  }
}
