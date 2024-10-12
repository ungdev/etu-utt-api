import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigModule } from '../../config/config.module';
import { RequestAuthData } from '../interfaces/request-auth-data.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigModule, private prisma: PrismaService) {
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
        apiKeyPermissions: {
          include: {
            grants: true,
          },
        },
      },
    });
    if (!apiKey) return null;
    const user = await this.prisma.user.findUnique({
      where: {
        id: apiKey.userId,
      },
    });
    const permissions: RequestAuthData['permissions'] = {};
    for (const permission of apiKey.apiKeyPermissions) {
      if (permissions[permission.permission] === '*') {
        continue;
      }
      if (!permission.soft) {
        permissions[permission.permission] = '*';
      } else {
        if (!permissions[permission.permission]) {
          permissions[permission.permission] = [];
        }
        (permissions[permission.permission] as string[]).push(...permission.grants.map((grant) => grant.userId));
      }
    }
    return {
      applicationId: apiKey.applicationId,
      user,
      permissions,
    };
  }
}
