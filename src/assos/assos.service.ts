import { Injectable } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { PrismaService } from '../prisma/prisma.service';
import { AssosSearchDto } from './dto/assos-search.dto';
import { AssosOverView, SelectAssosOverview } from './interfaces/assos-overview.interface';
import { AssosDetail, SelectAssoDetail } from './interfaces/assos-detail.interface';

@Injectable()
export class AssosService {
  constructor(readonly prisma: PrismaService, readonly config: ConfigModule) {}

  /**
   * Retrieves a page of {@link assosFormatted} matching the user query. This query searchs for a text in
   * the asso name, mail, and short description in any language.
   * @param query the query parameters of this route
   * @returns a page of {@link assosFormatted} matching the user query
   */
  async searchAssos(query: AssosSearchDto): Promise<Pagination<AssosOverView>> {
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

    const [assos, assosCount] = await this.prisma.$transaction([
      this.prisma.asso.findMany(
        SelectAssosOverview({
          where,
          take: this.config.PAGINATION_PAGE_SIZE,
          skip: ((query.page ?? 1) - 1) * this.config.PAGINATION_PAGE_SIZE,
          orderBy: {
            name: 'asc',
          },
        }),
      ),
      this.prisma.asso.count({ where }),
    ]);

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
  async getAsso(assoId: string): Promise<AssosDetail> {
    const asso = await this.prisma.asso.findUnique(
      SelectAssoDetail({
        where: {
          id: assoId,
        },
      }),
    );

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
