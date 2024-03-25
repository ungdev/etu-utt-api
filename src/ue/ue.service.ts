import { Injectable } from '@nestjs/common';
import { UESearchDto } from './dto/ue-search.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { UERateDto } from './dto/ue-rate.dto';
import { SelectUEOverview, UEOverView } from './interfaces/ue-overview.interface';
import { FormatUEDetail, SelectUEDetail, UEDetail } from './interfaces/ue-detail.interface';
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
