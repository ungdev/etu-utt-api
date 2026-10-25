import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { Prisma, RawAssoMembershipRole, RawAssoSympa } from '@/prisma/types.js';
import { ConfigService } from '@/config/config.service.js';
import { PrismaService } from '@/prisma/prisma.service.js';
import { Asso,
  AssoAccessAction,
  AssoAccessAttemptStatus,
  AssoAccessTokenData,
  AssoAccessConfirmation,
  AssoInfo,
  AssoAccessActionAndAssoId } from '@/assos/interfaces/asso.interface.js';
import { AssoMembership } from '@/assos/interfaces/membership.interface.js';
import { AssoMembershipRole } from '@/assos/interfaces/membership-role.interface.js';
import { User } from '@/users/interfaces/user.interface.js';
import { AssosSearchReqDto } from '@/assos/dto/req/assos-search-req.dto.js';
import { AssosMemberUpdateReqDto } from '@/assos/dto/req/assos-member-update-req.dto.js';
import { AppException, ERROR_CODE } from '@/exceptions.js';
import { AssosUpdateReqDto } from '@/assos/dto/req/assos-update-req.dto.js';
import { AssosAccessAttemptResDto } from '@/assos/dto/res/assos-access-attempt-res.dto.js';

@Injectable()
export class AssosService {
  private readonly logger = new Logger(AssosService.name);
  private readonly accessRequestHistory = new Map<string, number[]>();

  constructor(
    readonly prisma: PrismaService,
    readonly config: ConfigService,
    readonly jwt: JwtService,
  ) {}

  private getAccessRequestKey(scope: 'user' | 'asso', value: string): string {
    return `${scope}:${value}`;
  }

  private async recordAccessAttempt(
    userId: string,
    assoEmail: string,
    accepted: boolean,
    action: AssoAccessAction,
    failureReason?: number,
    tokenId?: string,
    assoId?: string,
    status: AssoAccessAttemptStatus = AssoAccessAttemptStatus.REQUESTED,
  ): Promise<void> {
    await this.prisma.assoAccessAttempt.create({
      data: { userId, assoEmail, accepted, action, failureReason, tokenId, ...(assoId ? { assoId } : {}), status },
    });
  }

  private async markAccessAttemptConfirmed(tokenId: string, assoId: string, action: AssoAccessAction): Promise<void> {
    await this.prisma.assoAccessAttempt.update({
      where: { tokenId },
      data: { status: AssoAccessAttemptStatus.CONFIRMED, assoId, action, confirmedAt: new Date() },
    });
  }

  private async markAccessAttemptConfirmationFailed(tokenId: string, confirmationFailureReason: number): Promise<void> {
    await this.prisma.assoAccessAttempt.update({
      where: { tokenId },
      data: {
        status: AssoAccessAttemptStatus.CONFIRM_FAILED,
        confirmationFailureReason,
      },
    });
  }

  private checkRateLimit(scope: 'user' | 'asso', value: string, maxPerHour: number): void {
    const key = this.getAccessRequestKey(scope, value);
    const now = Date.now();
    const recent = (this.accessRequestHistory.get(key) ?? []).filter((ts) => now - ts < 60 * 60 * 1000);

    if (recent.length >= maxPerHour) {
      this.logger.warn(`Association access rate limit reached for ${scope} ${value}`);
      throw new AppException(ERROR_CODE.ASSO_ACCESS_RATE_LIMIT);
    }

    recent.push(now);
    this.accessRequestHistory.set(key, recent);
  }

  async getAssoByEmail(email: string): Promise<Asso | null> {
    return this.prisma.normalize.asso.findUnique({
      where: { mail: email.trim().toLowerCase() },
    });
  }

  async getAssoByName(name: string): Promise<Asso | null> {
    return this.prisma.normalize.asso.findUnique({
      where: { name: name.trim() },
    });
  }

  async getAssoSympaByEmail(email: string): Promise<RawAssoSympa | null> {
    return this.prisma.assoSympa.findUnique({
      where: { mail: email.trim().toLowerCase() },
    });
  }

  async hasAnyAssoManager(assoId: string): Promise<boolean> {
    const managerCount = await this.prisma.assoMembership.count({
      where: {
        assoId,
        endAt: { gte: new Date() },
        OR: [
          { role: { isPresident: true } },
          { permissions: { some: { id: { in: ['manage_infos', 'manage_members', 'manage_roles', 'weekly'] } } } },
        ],
      },
    });
    return managerCount > 0;
  }

  async getAssoAccessAction(email: string, asso?: Asso | null): Promise<AssoAccessActionAndAssoId> {
    const existingAsso = asso === undefined ? await this.getAssoByEmail(email) : asso;
    if (!existingAsso) {
      if (!(await this.getAssoSympaByEmail(email))) {
        throw new AppException(ERROR_CODE.NO_SUCH_ASSO, email);
      }
      return { action: AssoAccessAction.CREATE, assoId: null };
    }
    if (await this.hasAnyAssoManager(existingAsso.id)) {
      throw new AppException(ERROR_CODE.ASSO_ACCESS_ALREADY_MANAGED);
    }
    return { action: AssoAccessAction.CLAIM, assoId: existingAsso.id };
  }

  async requestAssoAccess(
    user: User,
    email: string,
  ): Promise<{ action: AssoAccessAction; token: string; email: string }> {
    const assoEmail = email.trim().toLowerCase();
    let action: AssoAccessAction | undefined;
    let tokenId: string | undefined;
    let assoId: string | undefined;
    try {
      this.checkRateLimit('user', user.id, this.config.ASSOS_MAX_CLAIMS_PER_USER);

      const existingAsso = await this.getAssoByEmail(assoEmail);
      assoId = existingAsso?.id;
      if (existingAsso) action = AssoAccessAction.CLAIM;

      const access = await this.getAssoAccessAction(assoEmail, existingAsso);
      action = access.action;
      assoId = access.assoId;

      this.checkRateLimit('asso', assoEmail, this.config.ASSOS_MAX_CLAIMS_PER_ASSO);

      const expiresIn = this.config.ASSOS_CLAIM_TOKEN_EXPIRATION;
      tokenId = randomUUID();
      const token = await this.jwt.signAsync(
        {
          userId: user.id,
          assoEmail,
          ...(assoId ? { assoId } : {}),
          action,
          jti: tokenId,
        },
        {
          secret: this.config.JWT_SECRET,
          algorithm: 'HS256',
          expiresIn,
        },
      );

      await this.recordAccessAttempt(user.id, assoEmail, true, action, undefined, tokenId, assoId);
      this.logger.log(`Association access requested by user ${user.id} for ${assoEmail}; action=${action}`);
      return { action, token, email: assoEmail };
    } catch (error: unknown) {
      await this.recordAccessAttempt(
        user.id,
        assoEmail,
        false,
        action,
        error instanceof AppException ? error.code : null,
        tokenId,
        assoId,
        AssoAccessAttemptStatus.REJECTED,
      );
      this.logger.warn(`Association access refused for user ${user.id} and ${assoEmail}`);
      throw error;
    }
  }

  async getAssoAccessAttempts(asso: Asso): Promise<AssosAccessAttemptResDto[]> {
    const attempts = await this.prisma.assoAccessAttempt.findMany({
      where: { assoId: asso.id },
      orderBy: { createdAt: 'desc' },
    });

    return attempts.map((attempt) => ({
      ...attempt,
      status: attempt.status as AssoAccessAttemptStatus,
    }));
  }

  decodeAssoAccessToken(token: string): AssoAccessTokenData {
    try {
      const payload: unknown = this.jwt.verify(token, {
        secret: this.config.JWT_SECRET,
        algorithms: ['HS256'],
      });

      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        throw new AppException(ERROR_CODE.INVALID_ASSO_ACCESS_TOKEN);
      }

      const data = payload as Record<string, unknown>;
      const { userId, assoEmail, assoId, action, jti, iat, exp } = data;

      if (
        typeof userId !== 'string' ||
        !userId ||
        typeof assoEmail !== 'string' ||
        !assoEmail.trim() ||
        typeof jti !== 'string' ||
        !jti ||
        (action !== AssoAccessAction.CREATE && action !== AssoAccessAction.CLAIM) ||
        (assoId !== undefined && typeof assoId !== 'string') ||
        typeof exp !== 'number' ||
        !Number.isFinite(exp) ||
        (iat !== undefined && (typeof iat !== 'number' || !Number.isFinite(iat)))
      ) {
        throw new AppException(ERROR_CODE.INVALID_ASSO_ACCESS_TOKEN);
      }

      const issuedAt = typeof iat === 'number' ? iat : Math.floor(Date.now() / 1000);

      const associationId: string | undefined = typeof assoId === 'string' ? assoId : undefined;

      return {
        userId,
        assoEmail: assoEmail.trim().toLowerCase(),
        ...(associationId !== undefined ? { assoId: associationId } : {}),
        action,
        jti,
        iat: issuedAt,
        exp,
      };
    } catch (error: unknown) {
      if (error instanceof AppException) {
        throw error;
      }

      if (error instanceof Error && error.name === 'TokenExpiredError') {
        throw new AppException(ERROR_CODE.EXPIRED_ASSO_ACCESS_TOKEN);
      }

      throw new AppException(ERROR_CODE.INVALID_ASSO_ACCESS_TOKEN);
    }
  }

  async resolveAssoAccessAction(data: AssoAccessTokenData): Promise<AssoAccessAction> {
    const currentAsso = data.assoId ? await this.getAsso(data.assoId) : await this.getAssoByEmail(data.assoEmail);

    if (!currentAsso) return AssoAccessAction.CREATE;
    if (await this.hasAnyAssoManager(currentAsso.id)) {
      throw new AppException(ERROR_CODE.ASSO_ACCESS_ALREADY_MANAGED);
    }
    return AssoAccessAction.CLAIM;
  }

  async getAssoInfo(data: AssoAccessTokenData): Promise<AssoInfo> {
    const asso = await this.getAssoByEmail(data.assoEmail);
    const assoSympa = !asso ? await this.getAssoSympaByEmail(data.assoEmail) : null;

    return {
      action: await this.resolveAssoAccessAction(data),
      email: data.assoEmail,
      name: asso?.name ?? assoSympa?.name ?? null,
    };
  }

  async confirmAssoAccess(user: User, token: string, name?: string): Promise<AssoAccessConfirmation> {
    const data = this.decodeAssoAccessToken(token);
    if (!data) {
      throw new AppException(ERROR_CODE.INVALID_ASSO_ACCESS_TOKEN);
    }
    if (data.userId !== user.id) {
      throw new AppException(ERROR_CODE.FORBIDDEN_ASSO_ACCESS);
    }

    try {
      return await this.confirmAssoAccessAfterValidation(user, data, name);
    } catch (error) {
      await this.markAccessAttemptConfirmationFailed(data.jti, error instanceof AppException ? Number.parseInt(error.code) : null);
      throw error;
    }
  }

  private async confirmAssoAccessAfterValidation(
    user: User,
    data: AssoAccessTokenData,
    name?: string,
  ): Promise<AssoAccessConfirmation> {
    const action = await this.resolveAssoAccessAction(data);
    const existingAsso = await this.getAssoByEmail(data.assoEmail);
    const assoSympa = action === AssoAccessAction.CREATE ? await this.getAssoSympaByEmail(data.assoEmail) : null;

    if (action === AssoAccessAction.CREATE) {
      const cleanName = name?.trim() || assoSympa?.name;
      if (!cleanName) {
        throw new AppException(ERROR_CODE.PARAM_MISSING, 'name');
      }
      if (await this.getAssoByName(cleanName)) {
        throw new AppException(ERROR_CODE.ASSO_NAME_ALREADY_TAKEN, cleanName);
      }
      if (existingAsso) {
        throw new AppException(ERROR_CODE.ASSO_ALREADY_EXISTS);
      }

      const createdAsso = await this.prisma.$transaction(async (tx) => {
        const asso = await tx.asso.create({
          data: {
            name: cleanName,
            mail: data.assoEmail,
          },
        });

        const role = await tx.assoMembershipRole.create({
          data: {
            assoId: asso.id,
            name: 'President',
            position: 0,
            isPresident: true,
          },
        });

        await tx.assoMembership.create({
          data: {
            assoId: asso.id,
            userId: user.id,
            roleId: role.id,
            startAt: new Date(),
            endAt: new Date(Date.now() + this.config.ASSOS_CLAIM_TOKEN_EXPIRATION * 1000),
            permissions: {
              connect: [{ id: 'manage_infos' }, { id: 'manage_members' }, { id: 'manage_roles' }, { id: 'weekly' }],
            },
          },
        });

        return asso;
      });

      await this.markAccessAttemptConfirmed(data.jti, createdAsso.id, action);
      return { action: AssoAccessAction.CREATE as const, asso: createdAsso };
    }

    if (!existingAsso) {
      throw new AppException(ERROR_CODE.NO_SUCH_ASSO, data.assoEmail);
    }
    if (await this.hasAnyAssoManager(existingAsso.id)) {
      throw new AppException(ERROR_CODE.ASSO_ACCESS_ALREADY_MANAGED);
    }

    const createdMembership = await this.prisma.$transaction(async (tx) => {
      const role =
        (await tx.assoMembershipRole.findFirst({ where: { assoId: existingAsso.id, isPresident: true } })) ??
        (await tx.assoMembershipRole.create({
          data: {
            assoId: existingAsso.id,
            name: 'Président',
            position: 0,
            isPresident: true,
          },
        }));

      const membership = await tx.assoMembership.create({
        data: {
          assoId: existingAsso.id,
          userId: user.id,
          roleId: role.id,
          startAt: new Date(),
          endAt: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
          permissions: {
            connect: [{ id: 'manage_infos' }, { id: 'manage_members' }, { id: 'manage_roles' }, { id: 'weekly' }],
          },
        },
      });

      return membership;
    });

    await this.markAccessAttemptConfirmed(data.jti, existingAsso.id, action);
    return { action: AssoAccessAction.CLAIM, asso: existingAsso, membership: createdMembership };
  }

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
          ...additions
            .filter((x) => existingAdditionIds.includes(x))
            .map((id) =>
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

  /** Checks whether the user has at least one of the given permissions. */
  async hasSomeAssoPermission(asso: Asso, userId: string, ...perms: string[]): Promise<boolean> {
    const permissions = await this.getAssoPermissions(asso.id, userId, ...perms);
    return perms.some((p) => permissions.has(p));
  }

  /** Checks whether the user has all given permissions. */
  async hasEveryAssoPermission(asso: Asso, userId: string, ...perms: string[]): Promise<boolean> {
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
