import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthSignInDto, AuthSignUpDto } from './dto';
import * as bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AppException, ERROR_CODE } from '../exceptions';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { XMLParser } from 'fast-xml-parser';

// TODO : when other PRs will be merged, use the already defined PartiallyPartial type
type PartiallyPartial<T extends object, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
type RegisterData = { login: string; mail: string; lastName: string };

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private httpService: HttpService,
  ) {}

  async signup(dto: PartiallyPartial<AuthSignUpDto, 'password'>): Promise<string> {
    try {
      const isUTTMail = dto.mail?.endsWith('@utt.fr');
      const user = await this.prisma.user.create({
        data: {
          login: dto.login,
          hash: dto.password ? await this.getHash(dto.password) : undefined,
          firstName: dto.firstName,
          lastName: dto.lastName,
          studentId: dto.studentId,
          infos: {
            create: { sex: dto.sex, birthday: dto.birthday },
          },
          mailsPhones: {
            create: {
              mailUTT: isUTTMail ? dto.mail : undefined,
              mailPersonal: isUTTMail ? undefined : dto.mail,
            },
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
    const user = await this.prisma.user.findUnique({
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

  async casSignIn(
    service: string,
    ticket: string,
  ): Promise<{ status: 'invalid' | 'no_account' | 'ok'; token: string }> {
    const res = await lastValueFrom(
      this.httpService.get(`${this.config.get('CAS_URL')}/serviceValidate`, {
        params: { service, ticket },
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const resData: {
      ['cas:serviceResponse']:
        | {
            ['cas:authenticationSuccess']: {
              ['cas:attributes']: {
                'cas:uid': string;
                'cas:mail': string;
                'cas:sn': string;
              };
            };
          }
        | { 'cas:authenticationFailure': unknown };
    } = new XMLParser().parse(res.data);
    if ('cas:authenticationFailure' in resData['cas:serviceResponse']) {
      return { status: 'invalid', token: null };
    }
    const data: RegisterData = {
      login: resData['cas:serviceResponse']['cas:authenticationSuccess']['cas:attributes']['cas:uid'],
      mail: resData['cas:serviceResponse']['cas:authenticationSuccess']['cas:attributes']['cas:mail'],
      lastName: resData['cas:serviceResponse']['cas:authenticationSuccess']['cas:attributes']['cas:sn'],
      // TODO : fetch other infos from LDAP
    };
    const user = await this.prisma.user.findUnique({ where: { login: data.login } });
    if (!user) {
      const token = this.jwt.sign(data, { expiresIn: 60, secret: this.config.get('JWT_SECRET') });
      return { status: 'no_account', token };
    }
    return { status: 'ok', token: await this.signToken(user.id, data.login) };
  }

  async casSignUp(registerToken: string) {
    const data: RegisterData = this.jwt.decode(registerToken);
    return this.signup({ ...data, role: 'STUDENT', firstName: 'unknown' });
  }

  async signToken(userId: string, login: string): Promise<string> {
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
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }
}
