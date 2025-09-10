import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigModule } from '../../config/config.module';
import { RequestAuthData } from '../interfaces/request-auth-data.interface';
import { PermissionManager } from '../../utils';
import { ALL_PERMISSIONS, PermissionsDescriptor } from '../interfaces/permissions.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigModule,
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
    const permissions: PermissionsDescriptor = {};
    for (const permission of apiKey.apiKeyPermissions) {
      if (permissions[permission.permission] === ALL_PERMISSIONS) {
        continue;
      }
      if (!permission.userId) {
        permissions[permission.permission] = ALL_PERMISSIONS;
      } else {
        if (!permissions[permission.permission]) {
          permissions[permission.permission] = [];
        }
        (permissions[permission.permission] as string[]).push(permission.userId);
      }
    }
    return {
      application: apiKey.application,
      user,
      permissions: new PermissionManager(permissions),
    };
  }
}
