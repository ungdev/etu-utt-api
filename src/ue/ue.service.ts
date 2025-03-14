import { Injectable } from '@nestjs/common';
import { UeSearchReqDto } from './dto/req/ue-search-req.dto';
import { PrismaService } from '../prisma/prisma.service';
import { UeRateReqDto } from './dto/req/ue-rate-req.dto';
import { Ue } from './interfaces/ue.interface';
import { Criterion } from './interfaces/criterion.interface';
import { UeRating } from './interfaces/rate.interface';
import { ConfigModule } from '../config/config.module';
import { Language, Prisma } from '@prisma/client';
import { SemesterService } from '../semester/semester.service';
import { Pagination } from '../types';

@Injectable()
export class UeService {
  constructor(
    readonly prisma: PrismaService,
    readonly config: ConfigModule,
    readonly semesterService: SemesterService,
  ) {}

  /**
   * Retrieves a page of {@link Ue} matching the user query. This query searchs for a text in
   * the ue code, name, objectives and program. The user can restrict his research to a branch,
   * a branch option, a credit type or a semester.
   * @param query the query parameters of this route
   * @param language the language in which to search for text
   * @returns a page of {@link Ue} matching the user query
   */
  async searchUes(query: UeSearchReqDto, language: Language): Promise<Pagination<Ue>> {
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
                ueofs: {
                  some: {
                    code: { contains: query.q },
                  },
                },
              },
              {
                ueofs: {
                  some: {
                    name: {
                      [language]: {
                        contains: query.q,
                      },
                    },
                  },
                },
              },
              {
                ueofs: {
                  some: {
                    info: {
                      OR: [
                        { objectives: { [language]: { contains: query.q } } },
                        { program: { [language]: { contains: query.q } } },
                      ],
                    },
                  },
                },
              },
            ],
          }
        : {}),
      AND: [
        // Filter per branch option and branch if such a filter is present
        query.branchOption || query.branch
          ? {
              ueofs: {
                some: {
                  credits: {
                    some: {
                      branchOptions: {
                        some: {
                          AND: [
                            { code: query.branchOption },
                            {
                              branch: {
                                code: query.branch,
                              },
                            },
                          ],
                        },
                      },
                    },
                  },
                },
              },
            }
          : null,
        query.creditType
          ? {
              ueofs: {
                some: {
                  credits: {
                    some: {
                      category: {
                        code: query.creditType,
                      },
                    },
                  },
                },
              },
            }
          : null,
        // Filter per semester
        query.availableAtSemester
          ? {
              ueofs: {
                some: {
                  openSemester: {
                    some: {
                      code: query.availableAtSemester.toUpperCase(),
                    },
                  },
                },
              },
            }
          : null,
      ].filter((query) => query),
      // Filter per credit type
    } satisfies Prisma.UeWhereInput;
    const items = await this.prisma.ue.findMany({
      where,
      take: this.config.PAGINATION_PAGE_SIZE,
      skip: ((query.page ?? 1) - 1) * this.config.PAGINATION_PAGE_SIZE,
    });
    const itemCount = await this.prisma.ue.count({ where });
    // Data pagination
    return {
      items,
      itemCount,
      itemsPerPage: this.config.PAGINATION_PAGE_SIZE,
    };
  }

  /**
   * Retrieves a {@link Ue}
   * @remarks The ue must exist
   * @param code the code of the ue to retrieve
   * @returns the {@link UeDetail} of the ue matching the given code
   */
  getUe(code: string): Promise<Ue> {
    // Fetch an ue from the database. This ue shall not be returned as is because
    // it is not formatted at that point.
    return this.prisma.ue.findUnique({
      where: {
        code,
      },
    });
  }

  /**
   * Checks whether an ue exists
   * @param ueCode the code of the ue to check
   * @returns whether the ue exists
   */
  async doesUeExist(ueCode: string) {
    return !!(await this.prisma.ue.count({
      where: {
        code: ueCode,
      },
    }));
  }

  async findAlias(aliasCode: string) {
    return this.prisma.ueAlias.findUnique({
      where: {
        code: aliasCode,
      },
    });
  }

  async doesUeofExist(ueofCode: string) {
    return !!(await this.prisma.ueof.count({
      where: {
        code: ueofCode,
      },
    }));
  }

  /**
   * Retrieves the amount of UEOF the given {@link userId | user} has attended.
   * Not only this method can be used to retrieve the precise count of matching ueofs done by the user,
   * but also in order to check if a user has attended a specific UEOF.
   * The key feature of this function is that UEOF matching is done on both UEOF and UE codes,
   * allowing to check if a user has attended a specific UEOF or a specific UE.
   *
   * @param ueCodeOrUeofCode the code of the ue or the ueof to check
   * @param userId the user to check
   * @param semester provide a semester code to filter the ueofs by semester
   * @returns the amount of UEOF the {@link userId | user} has attended
   *
   * @example
   * ```typescript
   * const user: User = ...;
   * const ueCode: string = 'MT01';
   * // Check user has already done MT01
   * if (!(await ueService.hasUserAttended(ueCode, user.id))) {
   *   throw new AppException(ERROR_CODE.DUMMY_ERROR, 'This feature is only available for students who have attended MT01');
   * }
   * ```
   */
  async hasUserAttended(ueCodeOrUeofCode: string, userId: string, semester?: string): Promise<number> {
    return this.prisma.userUeSubscription.count({
      where: {
        userId: userId ?? null, // We want the filter to be applied in every query
        semesterId: semester || undefined, // This filter should be applied only if semester is not null
        ueof: {
          OR: [{ code: ueCodeOrUeofCode }, { ueId: ueCodeOrUeofCode }],
        },
      },
    });
  }

  /**
   * Checks whether a criterion exists
   * @param criterionId the id of the criterion to check
   * @returns whether the {@link criterionId | criterion} exists
   */
  async doesCriterionExist(criterionId: string) {
    return (
      (await this.prisma.ueStarCriterion.count({
        where: {
          id: criterionId,
        },
      })) != 0
    );
  }

  async hasAlreadyRated(userId: string, ueofCode: string, criterionId: string) {
    return (
      (await this.prisma.ueStarVote.count({
        where: {
          ueof: {
            code: ueofCode,
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
    return this.prisma.ueStarCriterion.findMany({});
  }

  /**
   * Retrieves the user ratings of a given ue
   * @remarks The user must not be null and the ue must exist
   * @param userId the user fetching his ratings
   * @param ueCode the code of the ue to fetch the rates of
   * @returns the rates of the {@link ueCode | ue} for the {@link user}
   */
  async getRateUe(
    userId: string,
    ueCode: string,
  ): Promise<{
    [ueofCode: string]: UeRating[];
  }> {
    const ueofs = await this.prisma.ueof.findMany({
      where: {
        ue: {
          code: ueCode,
        },
      },
    });
    return Object.fromEntries(
      await Promise.all(
        ueofs.map(
          async (ueof) =>
            [
              ueof.code,
              await this.prisma.ueStarVote.findMany({
                where: {
                  userId: userId,
                  ueofCode: ueof.code,
                },
              }),
            ] as const,
        ),
      ),
    );
  }

  /**
   * Creates or updates a rating for a given ue
   * @remarks The user must not be null and the ue must exist
   * @param userId the user rating the ue
   * @param ueofCode the code of the ue to rate
   * @param dto the rating to apply
   * @returns the new rate of the {@link ueofCode | ue} for the {@link user}
   */
  async rateUeof(userId: string, ueofCode: string, dto: UeRateReqDto): Promise<UeRating> {
    return this.prisma.ueStarVote.upsert({
      where: {
        ueofCode_userId_criterionId: {
          ueofCode: ueofCode,
          userId,
          criterionId: dto.criterion,
        },
      },
      create: {
        value: dto.value,
        criterionId: dto.criterion,
        ueofCode: ueofCode,
        userId,
      },
      update: {
        value: dto.value,
      },
    });
  }

  async unRateUeof(userId: string, ueofCode: string, criterionId: string): Promise<UeRating> {
    return this.prisma.ueStarVote.delete({
      where: {
        ueofCode_userId_criterionId: {
          ueofCode: ueofCode,
          userId,
          criterionId,
        },
      },
    });
  }

  async getUesOfUser(userId: string): Promise<Ue[]> {
    const currentSemester = await this.semesterService.getCurrentSemester();
    if (currentSemester === null) return [];
    return this.prisma.ue.findMany({
      where: {
        ueofs: {
          some: {
            usersSubscriptions: {
              some: {
                userId,
                semester: {
                  code: currentSemester.code,
                },
              },
            },
          },
        },
      },
    });
  }
}
