import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { User } from '../../users/interfaces/user.interface';
import { ConfigModule } from '../../config/config.module';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigModule, private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.JWT_SECRET,
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
    storedUser.permissions = user.permissions.map((permission) => permission.userPermissionId);
    return storedUser;
  }
}
