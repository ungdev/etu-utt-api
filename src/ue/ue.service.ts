import { Injectable } from '@nestjs/common';
import { UESearchDto } from './dto/ue-search.dto';
import { PrismaService } from '../prisma/prisma.service';
import { UERateDto } from './dto/ue-rate.dto';
import { UE } from './interfaces/ue.interface';
import { Criterion } from './interfaces/criterion.interface';
import { UERating } from './interfaces/rate.interface';
import { RawUserUESubscription } from '../prisma/types';
import { ConfigModule } from '../config/config.module';

@Injectable()
export class UEService {
  constructor(readonly prisma: PrismaService, readonly config: ConfigModule) {}

  /**
   * Retrieves a page of {@link UE} matching the user query. This query searchs for a text in
   * the ue code, name, comment, objectives and program. The user can restrict his research to a branch,
   * a branch option, a credit type or a semester.
   * @param query the query parameters of this route
   * @returns a page of {@link UE} matching the user query
   */
  async searchUEs(query: UESearchDto): Promise<Pagination<UE>> {
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
    const items = await this.prisma.uE.findMany({
      where,
      take: this.config.PAGINATION_PAGE_SIZE,
      skip: ((query.page ?? 1) - 1) * this.config.PAGINATION_PAGE_SIZE,
    });
    const itemCount = await this.prisma.uE.count({ where });
    // Data pagination
    return {
      items,
      itemCount,
      itemsPerPage: this.config.PAGINATION_PAGE_SIZE,
    };
  }

  /**
   * Retrieves a {@link UE}
   * @remarks The ue must exist
   * @param code the code of the ue to retrieve
   * @returns the {@link UEDetail} of the ue matching the given code
   */
  getUE(code: string): Promise<UE> {
    // Fetch an ue from the database. This ue shall not be returned as is because
    // it is not formatted at that point.
    return this.prisma.uE.findUnique({
      where: {
        code,
      },
    });
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
    return this.prisma.uEStarCriterion.findMany({});
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
    return this.prisma.uEStarVote.findMany({
      where: {
        userId: userId,
        ueId: UE.id,
      },
    });
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
    const ueId = await this.getUEIdFromCode(ueCode);
    return this.prisma.uEStarVote.upsert({
      where: {
        ueId_userId_criterionId: {
          ueId,
          userId,
          criterionId: dto.criterion,
        },
      },
      create: {
        value: dto.value,
        criterionId: dto.criterion,
        ueId,
        userId,
      },
      update: {
        value: dto.value,
      },
    });
  }

  async unRateUE(userId: string, ueCode: string, criterionId: string): Promise<UERating> {
    const ueId = await this.getUEIdFromCode(ueCode);
    return this.prisma.uEStarVote.delete({
      where: {
        ueId_userId_criterionId: {
          ueId,
          userId,
          criterionId,
        },
      },
    });
  }

  private async getUEIdFromCode(ueCode: string): Promise<string> {
    return (await this.prisma.withDefaultBehaviour.uE.findUnique({ where: { code: ueCode }, select: { id: true } })).id;
  }

  computeRate(rates: Array<{ createdAt: Date; value: number }>) {
    let coefficients = 0;
    let ponderation = 0;
    const newestCreationTimestamp = rates.reduce((acc, rate) => Math.max(rate.createdAt.getTime(), acc), 0);
    for (const { value, createdAt } of rates) {
      const dt = (newestCreationTimestamp - createdAt.getTime()) / 1000;
      const dp = Math.exp(-dt / 10e7);
      ponderation += dp * value;
      coefficients += dp;
    }
    return Math.round((ponderation / coefficients) * 10) / 10;
  }
}
