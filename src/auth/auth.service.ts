import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthSignInDto, AuthSignUpDto } from './dto';
import * as bcrypt from 'bcryptjs';
import { Prisma, UserRole } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { AppException, ERROR_CODE } from '../exceptions';
import { ConfigModule } from '../config/config.module';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { XMLParser } from 'fast-xml-parser';
import { doesEntryIncludeSome, omit } from '../utils';
import { LdapAccountGroup, LdapModule } from 'src/ldap/ldap.module';
import { UEService } from 'src/ue/ue.service';

export type RegisterData = { login: string; mail: string; lastName: string; firstName: string };
export type ExtendedRegisterData = RegisterData & { studentId: string; role: UserRole };

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigModule,
    private httpService: HttpService,
    private ldap: LdapModule,
    private ueService: UEService,
  ) {}

  /**
   * Creates a new user from the data that is provided to this function.
   * It returns an access token that the user can then use to authenticate their requests.
   * @param dto Data about the user to create.
   */
  async signup(dto: SetPartial<AuthSignUpDto, 'password'>, fetchLdap = false): Promise<string> {
    let phoneNumber: string = undefined;
    let formation: string = undefined;
    const branch: string[] = [];
    const branchOption: string[] = [];
    const ues: string[] = [];
    const currentSemesterCode = `${new Date().getMonth() < 7 && new Date().getMonth() > 0 ? 'P' : 'A'}${
      new Date().getFullYear() % 100
    }`;

    if (fetchLdap) {
      const ldapUser = await this.ldap.fetch(dto.login);
      if (ldapUser.gidNumber === LdapAccountGroup.STUDENTS) {
        dto.studentId = Number(ldapUser.supannEtuId);
        dto.role = 'STUDENT';
        branch.push(...(Array.isArray(ldapUser.niveau) ? ldapUser.niveau : [ldapUser.niveau]));
        ues.push(...(Array.isArray(ldapUser.uv) ? ldapUser.uv : [ldapUser.uv]));
        branchOption.push(...(Array.isArray(ldapUser.filiere) ? ldapUser.filiere : [ldapUser.filiere]));
        [formation] = ldapUser.formation; // TODO: this is wrong, students can have multiple formations !
      } else if (ldapUser.gidNumber === LdapAccountGroup.EMPLOYEES) {
        dto.role = doesEntryIncludeSome(ldapUser.eduPersonAffiliation, 'faculty') ? 'TEACHER' : 'EMPLOYEE';
        phoneNumber = ldapUser.telephonenumber;
      } else {
        dto.role = 'OTHER';
      }
    }
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
          ...(branch.length && branchOption.length
            ? {
                branch: {
                  create: {
                    semesterNumber: Number(branch[0].slice(-1)),
                    branch: {
                      connect: {
                        code: branch[0].slice(0, -1).split('_')[0],
                      },
                    },
                    branchOption: {
                      connect: {
                        code: branchOption[0],
                      },
                    },
                    semester: {
                      connect: {
                        code: currentSemesterCode,
                      },
                    },
                  },
                },
              }
            : {}),
          UEsSubscriptions: {
            createMany: {
              data: (
                await this.ueService.getIdFromCode(...ues)
              ).map((id) => ({
                ueId: id,
                semesterId: currentSemesterCode,
              })),
            },
          },
          formation: {
            create: {
              followingMethod: {
                connect: {
                  name: branch[0].slice(0, -1).split('_')[1] === 'APPR' ? 'Apprentissage' : 'Formation Initiale',
                },
              },
              formation: {
                connect: {
                  name: formation,
                },
              },
            },
          },
          mailsPhones: {
            create: {
              mailUTT: isUTTMail ? dto.mail : undefined,
              mailPersonal: isUTTMail ? undefined : dto.mail,
              phoneNumber,
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

  /**
   * Verifies the credentials are right.
   * It then returns an access_token the user can use to authenticate their requests.
   * @param dto Data needed to sign in the user (login & password).
   */
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

  /**
   * Returns whether the token is valid or not. An expired token is not considered valid.
   * @param token The token to verify.
   */
  isTokenValid(token: string): boolean {
    try {
      this.jwt.verify(token, { secret: this.config.JWT_SECRET });
    } catch (e) {
      return false;
    }
    return true;
  }

  /**
   * Another method of signing in. This method uses the UTT CAS.
   * It validates the service & ticket provided are right.
   * There are 3 possible return values :
   *   - { status: 'invalid', token: '' } : when the CAS returns that the provided values do not correspond to a known non-expired ticket.
   *   - { status: 'no_account', token: '<register_token>' } : when the validation was successful, but the user does not exist in our database. They need to create an account. The token provided is not a token to make requests, but contains information that will then be used to register the user.
   *   - { status: 'ok', token: '<token>' } : the user was successfully authenticated, the token is a normal access token that allows requests to be authenticated.
   * @param service The service parameter for the CAS API.
   * @param ticket The ticket that was assigned for this particular connection by the CAS API.
   */
  async casSignIn(
    service: string,
    ticket: string,
  ): Promise<{ status: 'invalid' | 'no_account' | 'ok'; token: string }> {
    const res = await lastValueFrom(
      this.httpService.get(`${this.config.CAS_URL}/serviceValidate`, { params: { service, ticket } }),
    );
    const resData: {
      ['cas:serviceResponse']:
        | {
            ['cas:authenticationSuccess']: {
              ['cas:attributes']: {
                'cas:uid': string;
                'cas:mail': string;
                'cas:sn': string;
                'cas:givenName': string;
              };
            };
          }
        | { 'cas:authenticationFailure': unknown };
    } = new XMLParser().parse(res.data);
    if ('cas:authenticationFailure' in resData['cas:serviceResponse']) {
      return { status: 'invalid', token: '' };
    }
    const data: RegisterData = {
      login: resData['cas:serviceResponse']['cas:authenticationSuccess']['cas:attributes']['cas:uid'],
      mail: resData['cas:serviceResponse']['cas:authenticationSuccess']['cas:attributes']['cas:mail'],
      lastName: resData['cas:serviceResponse']['cas:authenticationSuccess']['cas:attributes']['cas:sn'],
      firstName: resData['cas:serviceResponse']['cas:authenticationSuccess']['cas:attributes']['cas:givenName'],
    };
    const user = await this.prisma.user.findUnique({ where: { login: data.login } });
    if (!user) {
      const token = this.signRegisterToken(data);
      return { status: 'no_account', token };
    }
    return { status: 'ok', token: await this.signToken(user.id, data.login) };
  }

  /**
   * Decodes a register token to access the data it contains.
   * @param registerToken {@link RegisterData} that permits creating a user account, or null if the token format is invalid in any way.
   */
  decodeRegisterToken(registerToken: string): RegisterData | null {
    const data = this.jwt.decode(registerToken);
    if (!data || !('login' in data) || !('mail' in data) || !('firstName' in data) || !('lastName' in data)) {
      return null;
    }
    return omit(data, 'iat', 'exp') as RegisterData;
  }

  /**
   * Creates a token for user with the provided user id and login.
   * It returns the generated token.
   * @param userId The id of the user for who we are creating the token.
   * @param login The login of the user for who we are creating the token.
   */
  signToken(userId: string, login: string): Promise<string> {
    const payload = {
      sub: userId,
      login,
    };
    const secret = this.config.JWT_SECRET;

    return this.jwt.signAsync(payload, {
      expiresIn: this.config.JWT_EXPIRES_IN,
      secret: secret,
    });
  }

  /**
   * Creates a register token for the provided data. Returns that token.
   * When decoded, the returned token contains all the necessary information to register a new user.
   * @param data {@link RegisterData} that should be contained in the token.
   */
  signRegisterToken(data: RegisterData): string {
    return this.jwt.sign(data, { expiresIn: 60, secret: this.config.get('JWT_SECRET') });
  }

  /**
   * Returns the hash of a password.
   * @param password The password to hash.
   */
  getHash(password: string): Promise<string> {
    const saltRounds = Number.parseInt(this.config.SALT_ROUNDS);
    return bcrypt.hash(password, saltRounds);
  }
}
