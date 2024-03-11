import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthSignInDto, AuthSignUpDto } from './dto';
import * as bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AppException, ERROR_CODE } from '../exceptions';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService, private config: ConfigService) {}

  async signup(dto: AuthSignUpDto): Promise<string> {
    try {
      const user = await this.prisma.user.create({
        data: {
          login: dto.login,
          hash: await this.getHash(dto.password),
          firstName: dto.firstName,
          lastName: dto.lastName,
          studentId: dto.studentId,
          infos: {
            create: { sex: dto.sex, birthday: dto.birthday },
          },
          role: dto.role,
        },
      });

      return this.signToken(user.id, user.login);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new AppException(ERROR_CODE.CREDENTIALS_ALREADY_TAKEN);
        }
      }
      throw error;
    }
  }

  async signin(dto: AuthSignInDto): Promise<string> {
    // find the user by login, if it does not exist, throw exception
    const user = await this.prisma.withDefaultBehaviour.user.findUnique({
      where: {
        login: dto.login,
      },
    });
    if (!user) {
      throw new AppException(ERROR_CODE.INVALID_CREDENTIALS);
    }

    // compare password, if incorrect, throw exception
    const pwMatches = await bcrypt.compare(dto.password, user.hash);

    if (!pwMatches) {
      throw new AppException(ERROR_CODE.INVALID_CREDENTIALS);
    }

    return this.signToken(user.id, user.login);
  }

  isTokenValid(token: string): boolean {
    try {
      this.jwt.verify(token, { secret: this.config.get('JWT_SECRET') });
    } catch (e) {
      return false;
    }
    return true;
  }

  signToken(userId: string, login: string): Promise<string> {
    const payload = {
      sub: userId,
      login,
    };
    const secret = this.config.get('JWT_SECRET');

    return this.jwt.signAsync(payload, {
      expiresIn: this.config.get('JWT_EXPIRES_IN'),
      secret: secret,
    });
  }

  getHash(password: string): Promise<string> {
    const saltRounds = Number.parseInt(this.config.get('SALT_ROUNDS'));
    return bcrypt.hash(password, saltRounds);
  }
}
