import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { User } from '../../prisma/types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService, private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; login: string }) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.sub,
      },
      include: {
        infos: true,
        permissions: {
          select: {
            userPermissionId: true,
          },
        },
      },
    });

    delete user.hash;
    // Clear permissions
    const storedUser: User = { ...user, permissions: undefined };
    storedUser.permissions = user.permissions.map(
      (permission) => permission.userPermissionId,
    );
    return storedUser;
  }
}
