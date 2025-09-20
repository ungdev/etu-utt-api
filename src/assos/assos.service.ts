import { Injectable } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { PrismaService } from '../prisma/prisma.service';
import { Asso } from './interfaces/asso.interface';
import { AssoMembership, AssoMembershipRole } from './interfaces/membership-role.interface';
import AssosSearchReqDto from './dto/req/assos-search-req.dto';
import AssosMemberUpdateReqDto from './dto/req/assos-member-update.dto';

@Injectable()
export class AssosService {
  constructor(
    readonly prisma: PrismaService,
    readonly config: ConfigModule,
  ) {}

  /**
   * Retrieves a page of {@link assosFormatted} matching the user query. This query searchs for a text in
   * the asso name, mail, and short description in any language.
   * @param query the query parameters of this route
   * @returns a page of {@link assosFormatted} matching the user query
   */
  async searchAssos(query: AssosSearchReqDto): Promise<Pagination<Asso>> {
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
    const assos = await this.prisma.normalize.asso.findMany({
      where,
      take: this.config.PAGINATION_PAGE_SIZE,
      skip: ((query.page ?? 1) - 1) * this.config.PAGINATION_PAGE_SIZE,
    });
    const assosCount = await this.prisma.asso.count({ where });

    return {
      items: assos,
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
    return this.prisma.normalize.asso.findUnique({
      where: {
        id: assoId,
      },
    });
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

  async getAssoMembers(assoId: string) {
    return this.prisma.normalize.assoMembershipRole.findMany({
      where: {
        assoId,
      },
    });
  }

  async hasAssoPermission(assoId: string, userId: string, permission: string): Promise<boolean> {
    return (
      (await this.prisma.assoMembership.count({
        where: {
          assoId,
          OR: [
            {
              permissions: {
                some: {
                  id: permission,
                },
              },
            },
            { role: { isPresident: true } },
          ],
          user: {
            id: userId,
          },
          endAt: { gte: new Date() },
        },
      })) > 0
    );
  }

  async hasAssoPermissions(assoId: string, userId: string, perms: string[]): Promise<boolean> {
    const permissions = new Set(
      (
        await this.prisma.assoMembership.findMany({
          where: {
            asso: { id: assoId },
            user: { id: userId },
            endAt: { gte: new Date() },
            permissions: { some: { id: { in: perms } } },
          },
          select: {
            permissions: { select: { id: true } },
          },
        })
      ).flatMap((m) => m.permissions.map((p) => p.id)),
    );
    return perms.every((p) => permissions.has(p));
  }

  async createAssoRole(assoId: string, roleName: string): Promise<Omit<AssoMembershipRole, 'assoMembership'>> {
    const lastPosition =
      (await this.prisma.assoMembershipRole.findMany({
        where: { assoId },
        orderBy: { position: 'desc' },
        take: 1,
      })[0]?.position) ?? -1;
    return this.prisma.assoMembershipRole.create({
      data: {
        assoId,
        name: roleName,
        position: lastPosition + 1,
        isPresident: false,
      },
    });
  }

  async getAssoRole(roleId: string, assoId: string): Promise<Omit<AssoMembershipRole, 'assoMembership'>> {
    return this.prisma.assoMembershipRole.findUnique({
      where: { id: roleId, assoId },
    });
  }

  async deleteAssoRole(roleId: string): Promise<Omit<AssoMembershipRole, 'assoMembership'>> {
    const deletedRole = await this.prisma.assoMembershipRole.delete({
      where: { id: roleId },
    });
    await this.prisma.assoMembershipRole.updateMany({
      where: {
        assoId: deletedRole.assoId,
        position: {
          gte: deletedRole.position,
        },
      },
      data: {
        position: {
          decrement: 1,
        },
      },
    });
    return deletedRole;
  }

  async updateAssoRole(
    roleId: string,
    assoId: string,
    newData: Partial<Pick<AssoMembershipRole, 'name' | 'position'>>,
    oldData: Pick<AssoMembershipRole, 'name' | 'position'>,
  ): Promise<Omit<AssoMembershipRole, 'assoMembership'>[]> {
    if (newData.position !== oldData.position) {
      await this.prisma.$transaction([
        this.prisma.assoMembershipRole.updateMany({
          where: {
            position: {
              gte: Math.min(oldData.position, newData.position),
              lte: Math.max(oldData.position, newData.position),
            },
          },
          data: {
            position: {
              increment: newData.position > oldData.position ? -1 : 1,
            },
          },
        }),
        this.prisma.assoMembershipRole.update({
          where: { id: roleId },
          data: {
            position: newData.position,
            ...(newData.name ? { name: newData.name } : {}),
          },
        }),
      ]);
    }
    if (newData.name !== oldData.name)
      await this.prisma.assoMembershipRole.update({
        where: { id: roleId },
        data: {
          name: newData.name,
        },
      });
    return this.prisma.assoMembershipRole.findMany({
      where: { assoId },
    });
  }

  async hasRole(roleId: string, userId: string): Promise<boolean> {
    return (
      (await this.prisma.assoMembership.count({
        where: {
          roleId,
          user: {
            id: userId,
          },
          endAt: {
            gte: new Date(),
          },
        },
      })) > 0
    );
  }

  async addAssoMemberRole(
    assoId: string,
    userId: string,
    roleId: string,
    permissions: string[],
    end?: Date,
  ): Promise<AssoMembership & { permissions: { id: string }[] }> {
    return this.prisma.assoMembership.create({
      data: {
        asso: { connect: { id: assoId } },
        user: { connect: { id: userId } },
        role: { connect: { id: roleId } },
        permissions: {
          connect: permissions.map((p) => ({ id: p })),
        },
        startAt: new Date(),
        endAt: end ?? new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      },
      include: {
        permissions: {
          select: {
            id: true,
          },
        },
      },
    });
  }

  async getMembership(memberId: string): Promise<AssoMembership> {
    return this.prisma.assoMembership.findUnique({
      where: {
        id: memberId,
      },
      include: {
        permissions: {
          select: {
            id: true,
          },
        },
      },
    });
  }

  async updateAssoMember(
    memberId: string,
    update: Partial<AssosMemberUpdateReqDto> & { endAt: Date },
  ): Promise<AssoMembership> {
    return this.prisma.assoMembership.update({
      where: { id: memberId },
      data: {
        ...(update.endAt ? { endAt: update.endAt } : {}),
        ...(update.roleId ? { role: { connect: { id: update.roleId } } } : {}),
        ...(update.permissions
          ? {
              permissions: {
                set: update.permissions.map((p) => ({ id: p })),
              },
            }
          : {}),
      },
      include: {
        permissions: {
          select: {
            id: true,
          },
        },
      },
    });
  }
}
