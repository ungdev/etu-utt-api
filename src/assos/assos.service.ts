import { Injectable } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { PrismaService } from '../prisma/prisma.service';
import { AssosSearchDto } from './dto/assos-search.dto';
import { Asso } from './interfaces/asso.interface';

@Injectable()
export class AssosService {
  constructor(readonly prisma: PrismaService, readonly config: ConfigModule) {}

  /**
   * Retrieves a page of {@link assosFormatted} matching the user query. This query searchs for a text in
   * the asso name, mail, and short description in any language.
   * @param query the query parameters of this route
   * @returns a page of {@link assosFormatted} matching the user query
   */
  async searchAssos(query: AssosSearchDto): Promise<Pagination<Asso>> {
    const where = {
      ...(query.q
        ? {
            OR: [
              {
                name: {
                  contains: query.q,
                },
              },
              {
                mail: {
                  contains: query.q,
                },
              },
              {
                descriptionShortTranslation: {
                  OR: [
                    { fr: { contains: query.q } },
                    { en: { contains: query.q } },
                    { es: { contains: query.q } },
                    { de: { contains: query.q } },
                    { zh: { contains: query.q } },
                  ],
                },
              },
            ],
          }
        : {}),
    };
    const assos = await this.prisma.asso.findMany({
      where,
      take: this.config.PAGINATION_PAGE_SIZE,
      skip: ((query.page ?? 1) - 1) * this.config.PAGINATION_PAGE_SIZE,
    });
    const assosCount = await this.prisma.asso.count({ where });

    const assosFormatted = await Promise.all(
      assos.map(async (asso) => {
        const president = await this.prisma.assoMembership.findFirst({
          where: {
            asso: {
              id: asso.id,
            },
            role: {
              isPresident: true,
            },
          },
          select: {
            role: {
              select: {
                name: true,
              },
            },
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        });
        return {
          ...asso,
          president,
        };
      }),
    );

    return {
      items: assosFormatted,
      itemCount: assosCount,
      itemsPerPage: this.config.PAGINATION_PAGE_SIZE,
    };
  }

  /**
   * Retrieves a {@link assoFormatted}
   * @remarks The asso must exist
   * @param assoId the id of the asso to retrieve
   * @returns the {@link assoFormatted} of the asso matching the given id
   */
  async getAsso(assoId: string): Promise<Asso> {
    const asso = await this.prisma.asso.findUnique({
      where: {
        id: assoId,
      },
    });

    const president = await this.prisma.assoMembership.findFirst({
      where: {
        asso: {
          id: assoId,
        },
        role: {
          isPresident: true,
        },
      },
      select: {
        role: {
          select: {
            name: true,
          },
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const assoFormatted = {
      ...asso,
      president,
    };

    return assoFormatted;
  }

  /**
   * Checks whether an asso exists
   * @param assoId the id of the asso to check
   * @returns whether the asso exists
   */
  async doesAssoExist(assoId: string) {
    return (
      (await this.prisma.asso.count({
        where: {
          id: assoId,
        },
      })) != 0
    );
  }
}
