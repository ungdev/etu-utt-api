import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ConfigModule } from '../config/config.module';
import { PrismaService } from '../prisma/prisma.service';
import { RawAssoMembershipRole } from '../prisma/types';
import { Asso } from './interfaces/asso.interface';
import { AssoMembership } from './interfaces/membership.interface';
import { AssoMembershipRole } from './interfaces/membership-role.interface';
import AssosSearchReqDto from './dto/req/assos-search-req.dto';
import AssosMemberUpdateReqDto from './dto/req/assos-member-update.dto';
import { AppException, ERROR_CODE } from '../exceptions';
import AssosUpdateReqDto from './dto/req/assos-update-req.dto';

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

  async updateAsso(assoId: string, update: AssosUpdateReqDto): Promise<Asso> {
    const updated = await this.prisma.normalize.asso.update({
      where: { id: assoId },
      data: {
        ...(update.name ? { name: update.name } : {}),
        ...(update.logo ? { logo: { connect: { id: update.logo } } } : {}),
        ...(update.descriptionShort ? { descriptionShortTranslation: { update: update.descriptionShort } } : {}),
        ...(update.description ? { descriptionTranslation: { update: update.description } } : {}),
        ...(update.email ? { mail: update.email } : {}),
        ...(update.phoneNumber ? { phoneNumber: update.phoneNumber } : {}),
        ...(update.website ? { website: update.website } : {}),
      },
    });
    if (update.description) {
      // Cleanup unused images
      const regex = /"src":"https:\/\/[^"]+\/media\/image\/([0-9a-f-]{36})\.webp"/g;
      const imagesInUse = new Set<string>();
      for (const field in updated.descriptionTranslation)
        for (const match of (<string>updated.descriptionTranslation[field])?.matchAll(regex) ?? [])
          imagesInUse.add(match[1]);
      const currentImages = (
        await this.prisma.imageMedia.findMany({
          where: { descriptionForAssos: { some: { id: assoId } } },
          select: { id: true },
        })
      ).map((m) => m.id);
      const deletions = currentImages.filter((x) => !imagesInUse.has(x));
      const additions = [...imagesInUse].filter((x) => !currentImages.includes(x));
      const existingAdditionIds = (
        await this.prisma.imageMedia.findMany({
          where: { id: { in: additions } },
          select: { id: true },
        })
      ).map((m) => m.id);
      if (deletions.length > 0 || additions.length > 0)
        await this.prisma.$transaction([
          ...deletions.map((id) =>
            this.prisma.imageMedia.update({
              where: { id },
              data: { descriptionForAssos: { disconnect: { id: assoId } } },
            }),
          ),
          ...additions.filter((x) => existingAdditionIds.includes(x)).map((id) =>
            this.prisma.imageMedia.update({
              where: { id },
              data: { descriptionForAssos: { connect: { id: assoId } } },
            }),
          ),
        ]);
    }
    return updated;
  }

  async getAssoMembers(assoId: string): Promise<AssoMembershipRole[]> {
    return this.prisma.normalize.assoMembershipRole.findMany({
      where: {
        assoId,
      },
    });
  }

  private async getAssoPermissions(assoId: string, userId: string, ...perms: string[]) {
    return new Set(
      (
        await this.prisma.normalize.assoMembership.findMany({
          where: {
            asso: { id: assoId },
            user: { id: userId },
            endAt: { gte: new Date() },
            permissions: { some: { id: { in: perms } } },
          },
        })
      ).flatMap((m) => m.permissions.map((p) => p.id)),
    );
  }

  /** Checks whether the user has at least one of the given permissions. Includes asso account check */
  async hasSomeAssoPermission(asso: Asso, userId: string, ...perms: string[]): Promise<boolean> {
    if (asso.assoAccountId === userId) return true;
    const permissions = await this.getAssoPermissions(asso.id, userId, ...perms);
    return perms.some((p) => permissions.has(p));
  }

  /** Checks whether the user has all given permissions. Includes asso account check */
  async hasEveryAssoPermission(asso: Asso, userId: string, ...perms: string[]): Promise<boolean> {
    if (asso.assoAccountId === userId) return true;
    const permissions = await this.getAssoPermissions(asso.id, userId, ...perms);
    return perms.every((p) => permissions.has(p));
  }

  async createAssoRole(assoId: string, roleName: string): Promise<RawAssoMembershipRole> {
    const lastPosition =
      (
        await this.prisma.assoMembershipRole.findFirst({
          where: { assoId },
          orderBy: { position: 'desc' },
          take: 1,
        })
      )?.position ?? -1;
    return this.prisma.assoMembershipRole.create({
      data: {
        assoId,
        name: roleName,
        position: lastPosition + 1,
        isPresident: false,
      },
    });
  }

  async getRoleRange(assoId: string): Promise<number> {
    return this.prisma.assoMembershipRole
      .findFirst({
        where: { assoId },
        orderBy: { position: 'desc' },
        take: 1,
      })
      .then((r) => (r ? r.position : 0));
  }

  async getAssoRole(roleId: string, assoId: string): Promise<RawAssoMembershipRole> {
    return this.prisma.assoMembershipRole.findUnique({
      where: { id: roleId, assoId },
    });
  }

  async deleteAssoRole(roleId: string): Promise<RawAssoMembershipRole> {
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
  ): Promise<RawAssoMembershipRole[]> {
    // This poll must be performed the closest possible to the transaction
    try {
      const [{ position }, { count }] = await this.prisma.$transaction([
        this.prisma.assoMembershipRole.findFirstOrThrow({
          where: { id: roleId, assoId, position: { gte: 0 } },
          select: { position: true },
        }),
        this.prisma.assoMembershipRole.updateMany({
          where: { id: roleId, position: { gte: 0 } },
          data: { position: -1 },
        }),
      ]);
      if (count < 1) throw new AppException(ERROR_CODE.ASSO_ROLE_ALREADY_MOVED);
      await this.prisma.$transaction([
        this.prisma.assoMembershipRole.updateMany({
          where: {
            position: {
              gte: Math.min(position, newData.position),
              lte: Math.max(position, newData.position),
            },
          },
          data: {
            position: {
              increment: newData.position !== position ? (newData.position > position ? -1 : 1) : 0,
            },
          },
        }),
        this.prisma.assoMembershipRole.update({
          where: { id: roleId },
          data: {
            position: newData.position,
            name: newData.name,
          },
        }),
      ]);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025')
        throw new AppException(ERROR_CODE.ASSO_ROLE_ALREADY_MOVED);
      throw e;
    }
    return this.prisma.assoMembershipRole.findMany({
      where: { assoId },
      orderBy: { position: 'asc' },
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

  async addAssoMembership(
    assoId: string,
    userId: string,
    roleId: string,
    permissions: string[],
    end?: Date,
  ): Promise<AssoMembership> {
    return this.prisma.normalize.assoMembership.create({
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
    });
  }

  async getMembership(memberId: string): Promise<AssoMembership> {
    return this.prisma.normalize.assoMembership.findUnique({
      where: {
        id: memberId,
      },
    });
  }

  async updateAssoMember(memberId: string, update: AssosMemberUpdateReqDto): Promise<AssoMembership> {
    return this.prisma.normalize.assoMembership.update({
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
    });
  }
}
