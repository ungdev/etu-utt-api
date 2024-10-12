import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { Prisma, UserType } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { AppException, ERROR_CODE } from '../exceptions';
import { ConfigModule } from '../config/config.module';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { XMLParser } from 'fast-xml-parser';
import { doesEntryIncludeSome, omit } from '../utils';
import { LdapModule } from '../ldap/ldap.module';
import { LdapAccountGroup } from '../ldap/ldap.interface';
import { UeService } from '../ue/ue.service';
import { SemesterService } from '../semester/semester.service';
import AuthSignUpReqDto from './dto/req/auth-sign-up-req.dto';
import AuthSignInReqDto from './dto/req/auth-sign-in-req.dto';

export type RegisterUserData = { login: string; mail: string; lastName: string; firstName: string };
export type RegisterApiKeyData = { userId: string; applicationId: string };

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigModule,
    private httpService: HttpService,
    private ldap: LdapModule,
    private ueService: UeService,
    private semesterService: SemesterService,
  ) {}

  /**
   * Creates a new user from the data that is provided to this function.
   * It returns an access token that the user can then use to authenticate their requests.
   * @param dto Data about the user to create.
   * @param applicationId The id of the application we are connecting with.
   * @param fetchLdap Whether user information should be imported from the UTT LDAP.
   * @param tokenExpiresIn The time the return token will be valid, in seconds. If not given, token will not expire.
   */
  async signup(
    dto: SetPartial<AuthSignUpReqDto, 'password'>,
    applicationId: string,
    fetchLdap = false,
    tokenExpiresIn?: number,
  ): Promise<string> {
    let phoneNumber: string = undefined;
    let formation: string = undefined;
    const branch: string[] = [];
    const branchOption: string[] = [];
    const ues: string[] = [];
    let type: UserType = UserType.OTHER;
    const currentSemester = await this.semesterService.getCurrentSemester();

    if (fetchLdap) {
      const ldapUser = await this.ldap.fetch(dto.login);
      if (ldapUser) {
        if (ldapUser.gidNumber === LdapAccountGroup.STUDENTS) {
          dto.studentId = Number(ldapUser.supannEtuId);
          type = UserType.STUDENT;
          branch.push(...(Array.isArray(ldapUser.niveau) ? ldapUser.niveau : [ldapUser.niveau]));
          ues.push(...(Array.isArray(ldapUser.uv) ? ldapUser.uv : [ldapUser.uv]));
          branchOption.push(...(Array.isArray(ldapUser.filiere) ? ldapUser.filiere : [ldapUser.filiere]));
          [formation] = Array.isArray(ldapUser.formation) ? ldapUser.formation : [ldapUser.formation]; // TODO: this is wrong, students can have multiple formations !
        } else if (ldapUser.gidNumber === LdapAccountGroup.EMPLOYEES) {
          type = doesEntryIncludeSome(ldapUser.eduPersonAffiliation, 'faculty') ? UserType.TEACHER : UserType.EMPLOYEE;
          phoneNumber = ldapUser.telephoneNumber;
        }
      }
    }
    try {
      const isUTTMail = dto.mail?.endsWith('@utt.fr');
      const user = await this.prisma.withDefaultBehaviour.user.create({
        data: {
          login: dto.login,
          hash: dto.password ? await this.getHash(dto.password) : undefined,
          firstName: dto.firstName,
          lastName: dto.lastName,
          studentId: dto.studentId,
          infos: {
            create: { sex: dto.sex, birthday: dto.birthday },
          },
          apiKeys: {
            create: {
              token: this.generateToken(),
              tokenUpdatedAt: new Date(),
              application: { connect: { id: applicationId } },
            },
          },
          ...(branch.length && branchOption.length && currentSemester
            ? {
                branchSubscriptions: {
                  create: {
                    semesterNumber: Number(branch[0].slice(-1)),
                    branchOption: {
                      connectOrCreate: {
                        where: {
                          code_branchCode: {
                            code: branchOption[0],
                            branchCode: branch[0].slice(0, -1).split('_')[0],
                          },
                        },
                        create: {
                          code: branchOption[0],
                          branch: {
                            connect: {
                              code: branch[0].slice(0, -1).split('_')[0],
                            },
                          },
                          name: branchOption[0],
                          descriptionTranslation: {
                            create: {
                              fr: '',
                            },
                          },
                        },
                      },
                    },
                    semester: {
                      connect: {
                        code: currentSemester.code,
                      },
                    },
                  },
                },
              }
            : {}),
          UesSubscriptions: currentSemester
            ? {
                createMany: {
                  data: (
                    await this.ueService.getIdFromCode(ues)
                  ).map((id) => ({
                    ueId: id,
                    semesterId: currentSemester.code,
                  })),
                },
              }
            : {},
          ...(branch.length && formation
            ? {
                formation: {
                  create: {
                    followingMethod: {
                      connectOrCreate: {
                        create: {
                          name:
                            branch[0].slice(0, -1).split('_')[1] === 'APPR' ? 'Apprentissage' : 'Formation Initiale',
                          descriptionTranslation: {
                            create: {},
                          },
                        },
                        where: {
                          name:
                            branch[0].slice(0, -1).split('_')[1] === 'APPR' ? 'Apprentissage' : 'Formation Initiale',
                        },
                      },
                    },
                    formation: {
                      connectOrCreate: {
                        where: {
                          name: formation,
                        },
                        create: {
                          name: formation,
                          descriptionTranslation: {
                            create: {},
                          },
                        },
                      },
                    },
                  },
                },
              }
            : {}),
          mailsPhones: {
            create: {
              mailUTT: isUTTMail ? dto.mail : undefined,
              mailPersonal: isUTTMail ? undefined : dto.mail,
              phoneNumber,
            },
          },
          socialNetwork: { create: {} },
          preference: { create: {} },
          rgpd: { create: {} },
          userType: type,
          privacy: { create: {} },
        },
        include: {
          apiKeys: true,
        },
      });

      return this.signAuthenticationToken(user.apiKeys[0].token, tokenExpiresIn);
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
   * @param applicationId The id of the application to which the user should be signed in.
   * @param tokenExpiresIn The time the return token will be valid, in seconds. If not given, token will not expire.
   */
  async signin(
    dto: AuthSignInReqDto,
    applicationId: string,
    tokenExpiresIn?: number,
  ): Promise<{ signedIn: boolean; token: string } | null> {
    // find the user by login, if it does not exist, throw exception
    const user = await this.prisma.withDefaultBehaviour.user.findUnique({
      where: {
        login: dto.login,
      },
      include: {
        apiKeys: {
          where: {
            application: {
              id: applicationId,
            },
          },
        },
      },
    });
    if (!user) {
      return null;
    }

    // compare password, if incorrect, throw exception
    const pwMatches = await bcrypt.compare(dto.password, user.hash);

    if (!pwMatches) {
      return null;
    }

    if (!user.apiKeys.length) {
      return { signedIn: false, token: await this.signRegisterToken({ userId: user.id } as RegisterApiKeyData) };
    }
    return { signedIn: true, token: await this.signAuthenticationToken(user.apiKeys[0].token, tokenExpiresIn) };
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
   * @param applicationId The application the user is trying to log with.
   * @param tokenExpiresIn The time the return token will be valid, in seconds. If not given, token will not expire.
   */
  async casSignIn(
    service: string,
    ticket: string,
    applicationId: string,
    tokenExpiresIn?: number,
  ): Promise<{ status: 'invalid' | 'no_account' | 'no_api_key' | 'ok'; token: string }> {
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
    const data: RegisterUserData = {
      login: resData['cas:serviceResponse']['cas:authenticationSuccess']['cas:attributes']['cas:uid'],
      mail: resData['cas:serviceResponse']['cas:authenticationSuccess']['cas:attributes']['cas:mail'],
      lastName: resData['cas:serviceResponse']['cas:authenticationSuccess']['cas:attributes']['cas:sn'],
      firstName: resData['cas:serviceResponse']['cas:authenticationSuccess']['cas:attributes']['cas:givenName'],
    };
    const user = await this.prisma.withDefaultBehaviour.user.findUnique({
      where: { login: data.login },
      include: { apiKeys: { where: { application: { id: applicationId } } } },
    });
    if (!user) {
      return { status: 'no_account', token: await this.signRegisterToken(data) };
    }
    if (!user.apiKeys.length) {
      return { status: 'no_api_key', token: await this.signRegisterToken({ userId: user.id, applicationId }) };
    }
    return { status: 'ok', token: await this.signAuthenticationToken(user.apiKeys[0].token, tokenExpiresIn) };
  }

  /**
   * Decodes a register token to access the data it contains.
   * @param registerToken {@link RegisterUserData} that permits creating a user account, or null if the token format is invalid in any way.
   */
  decodeRegisterUserToken(registerToken: string): RegisterUserData | null {
    const data = this.jwt.decode(registerToken);
    if (!data || !('login' in data) || !('mail' in data) || !('firstName' in data) || !('lastName' in data)) {
      return null;
    }
    return omit(data, 'iat', 'exp') as RegisterUserData;
  }

  /**
   * Decodes a register api key token to access the data it contains.
   * @param registerToken {@link RegisterApiKeyData} that permits creating the Api Key linking the user and the given application.
   */
  decodeRegisterApiKeyToken(registerToken: string): RegisterApiKeyData | null {
    const data = this.jwt.decode(registerToken);
    if (!data || !('userId' in data)) {
      return null;
    }
    return omit(data, 'iat', 'exp') as RegisterApiKeyData;
  }

  /**
   * Creates a token for user with the provided user id and login.
   * It returns the generated token.
   * @param token The token to sign.
   * @param expiresIn The number of seconds in which the token will expire. If not given, token will never expire.
   */
  signAuthenticationToken(token: string, expiresIn?: number): Promise<string> {
    const payload = { token };
    const secret = this.config.JWT_SECRET;

    return this.jwt.signAsync(payload, {
      secret,
      ...(expiresIn !== undefined ? { expiresIn } : {}),
    });
  }

  /**
   * Creates a register token for the provided data. Returns that token.
   * When decoded, the returned token contains all the necessary information to register a new user.
   * @param data {@link RegisterUserData} that should be contained in the token.
   */
  signRegisterToken(data: RegisterUserData | RegisterApiKeyData): Promise<string> {
    return this.jwt.signAsync(data, { expiresIn: 60, secret: this.config.JWT_SECRET });
  }

  /**
   * Returns the hash of a password.
   * @param password The password to hash.
   */
  getHash(password: string): Promise<string> {
    const saltRounds = this.config.SALT_ROUNDS;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Creates an API Key, and returns the signed token.
   */
  async createApiKey(userId: string, applicationId: string, tokenExpiresIn?: number): Promise<string> {
    const apiKey = await this.prisma.withDefaultBehaviour.apiKey.create({
      data: {
        user: {
          connect: {
            id: userId,
          },
        },
        application: {
          connect: {
            id: applicationId,
          },
        },
        token: this.generateToken(),
        tokenUpdatedAt: new Date(),
      },
    });
    return this.signAuthenticationToken(apiKey.token, tokenExpiresIn);
  }

  /**
   * Generates a completely random string composed of
   * @private
   */
  private generateToken(): string {
    const random = () => Math.random().toString(36).substring(2);
    const tokenLength = 128;
    let token = '';
    while (token.length < tokenLength) {
      token += random();
    }
    return token.slice(0, tokenLength);
  }
}
