import { Injectable } from '@nestjs/common';
import { UeSearchDto } from './dto/ue-search.dto';
import { PrismaService } from '../prisma/prisma.service';
import { UeRateDto } from './dto/ue-rate.dto';
import { Ue } from './interfaces/ue.interface';
import { Criterion } from './interfaces/criterion.interface';
import { UeRating } from './interfaces/rate.interface';
import { RawUserUeSubscription } from '../prisma/types';
import { ConfigModule } from '../config/config.module';
import { Language, Prisma } from '@prisma/client';
import { SemesterService } from '../semester/semester.service';

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
  async searchUes(query: UeSearchDto, language: Language): Promise<Pagination<Ue>> {
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
      // Filter per branch option and branch if such a filter is present
      ...(query.branchOption || query.branch
        ? {
            ueofs: {
              some: {
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
              },
            },
          }
        : {}),
      // Filter per credit type
      ...(query.creditType
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
        : {}),
      // Filter per semester
      ...(query.availableAtSemester
        ? {
            ueofs: {
              some: {
                openSemester: {
                  some: {
                    code: query.availableAtSemester?.toUpperCase(),
                  },
                },
              },
            },
          }
        : {}),
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
   * Retrieves the last semester done by a user for a given ue
   * @remarks The user must not be null
   * @param userId the user to retrieve semesters of
   * @param ueCode the code of the UE
   * @returns the last semester done by the {@link user} for the {@link ueCode | ue}
   */
  async getLastSemesterDoneByUser(userId: string, ueCode: string): Promise<RawUserUeSubscription> {
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
   * Checks whether an ue exists
   * @param ueCode the code of the ue to check
   * @returns whether the ue exists
   */
  async doesUeExist(ueCode: string) {
    return !!(await this.prisma.ue.findUnique({
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

  /**
   * Checks whether a user has already done an ue
   * @remarks The user must not be null
   * @param userId the user to check
   * @param ueCode the code of the ue to check
   * @returns whether the {@link user} has already done the {@link ueCode | ue}
   */
  async hasAlreadyDoneThisUe(userId: string, ueCode: string) {
    return (await this.getLastSemesterDoneByUser(userId, ueCode)) != null;
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

  async hasAlreadyRated(userId: string, ueCode: string, criterionId: string) {
    return (
      (await this.prisma.ueStarVote.count({
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
    return this.prisma.ueStarCriterion.findMany({});
  }

  /**
   * Retrieves the user ratings of a given ue
   * @remarks The user must not be null and the ue must exist
   * @param userId the user fetching his ratings
   * @param ueCode the code of the ue to fetch the rates of
   * @returns the rates of the {@link ueCode | ue} for the {@link user}
   */
  async getRateUe(userId: string, ueCode: string): Promise<UeRating[]> {
    const ue = await this.prisma.ue.findUnique({
      where: {
        code: ueCode,
      },
    });
    return this.prisma.ueStarVote.findMany({
      where: {
        userId: userId,
        ueId: ue.code,
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
  async doRateUe(userId: string, ueCode: string, dto: UeRateDto): Promise<UeRating> {
    return this.prisma.ueStarVote.upsert({
      where: {
        ueId_userId_criterionId: {
          ueId: ueCode,
          userId,
          criterionId: dto.criterion,
        },
      },
      create: {
        value: dto.value,
        criterionId: dto.criterion,
        ueId: ueCode,
        userId,
      },
      update: {
        value: dto.value,
      },
    });
  }

  async unRateUe(userId: string, ueCode: string, criterionId: string): Promise<UeRating> {
    return this.prisma.ueStarVote.delete({
      where: {
        ueId_userId_criterionId: {
          ueId: ueCode,
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
