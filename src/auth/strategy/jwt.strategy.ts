import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '../../config/config.service';
import { RequestAuthData } from '../interfaces/request-auth-data.interface';
import { PermissionManager } from '../../utils';
import { UserPermission } from '../interfaces/permissions.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.JWT_SECRET,
    });
  }

  async validate(payload: { token: string }): Promise<RequestAuthData> {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: {
        token: payload.token,
      },
      include: {
        apiKeyPermissions: true,
        application: true,
      },
    });
    if (!apiKey) return null;
    const user = await this.prisma.normalize.user.findUnique({
      where: {
        id: apiKey.userId,
      },
    });
    const permissions = new PermissionManager();
    for (const permission of apiKey.apiKeyPermissions) {
      // If it's an API permission, permission.userId will be undefined, so it does not really matter that typing isn't exact here.
      permissions.with(permission.permission as UserPermission, permission.userId);
    }
    return {
      application: apiKey.application,
      user,
      permissions,
    };
  }
}
