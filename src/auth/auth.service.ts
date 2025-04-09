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
import { RawApiKey } from '../prisma/types';
import crypto from 'crypto';

export type RegisterUserData = {
  login: string;
  mail: string;
  lastName: string;
  firstName: string;
  tokenExpiresIn: number;
};
export type RegisterApiKeyData = { userId: string; applicationId: string; tokenExpiresIn: number };
export type ValidationTokenData = {
  apiKeyId: string;
  applicationId: string;
  tokenExpiresIn: number;
};

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
          ues.push(...(Array.isArray(ldapUser.uv) ? ldapUser.uv : [ldapUser.uv])); // TODO : check what is done by the admin : are they UEOF or UE codes ?
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
          apiKeys: {
            create: {
              token: AuthService.generateToken(),
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
          uesSubscriptions: currentSemester
            ? {
                createMany: {
                  data: ues.map((id) => ({
                    ueofCode: id,
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
   * It then returns a token the user can use to authenticate their requests.
   * @param login The login used to sign in.
   * @param password The password used to sign in.
   * @param applicationId The id of the application to which the user should be signed in.
   * @returns signedIn If false, the user has no apiKeys linked to that application. {@link token} is therefore used to authorize login with the app.
   * @returns token The bearer token to use if connection was successful, or the token that should be sent through route "POST /auth/api-key" to create an api key for the app.
   */
  async signin(
    login: string,
    password: string,
    applicationId: string,
  ): Promise<{ userId: string; apiKey: RawApiKey } | null> {
    // find the user by login, if it does not exist, throw exception
    const user = await this.prisma.user.findUnique({
      where: { login },
    });
    if (!user) {
      return null;
    }

    // compare password, if incorrect, throw exception
    const pwMatches = await bcrypt.compare(password, user.hash);

    if (!pwMatches) {
      return null;
    }

    const apiKey = await this.prisma.apiKey.findUnique({
      where: { userId_applicationId: { userId: user.id, applicationId } },
    });

    return { userId: user.id, apiKey };
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
   * @param ticket The ticket that was assigned for this particular connection by the CAS API.
   * @param applicationId The application the user is trying to log with.
   */
  async casSignIn(
    ticket: string,
    applicationId: string,
  ): Promise<{
    userId: string;
    apiKeyId: string;
    basicUserData: { login: string; mail: string; lastName: string; firstName: string };
  } | null> {
    const res = await lastValueFrom(
      this.httpService.get(`${this.config.CAS_URL}/serviceValidate`, {
        params: { service: this.config.CAS_SERVICE, ticket },
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
                'cas:givenName': string;
              };
            };
          }
        | { 'cas:authenticationFailure': unknown };
    } = new XMLParser().parse(res.data);
    if ('cas:authenticationFailure' in resData['cas:serviceResponse']) {
      return null;
    }
    const data = {
      login: resData['cas:serviceResponse']['cas:authenticationSuccess']['cas:attributes']['cas:uid'],
      mail: resData['cas:serviceResponse']['cas:authenticationSuccess']['cas:attributes']['cas:mail'],
      lastName: resData['cas:serviceResponse']['cas:authenticationSuccess']['cas:attributes']['cas:sn'],
      firstName: resData['cas:serviceResponse']['cas:authenticationSuccess']['cas:attributes']['cas:givenName'],
    };
    const user = await this.prisma.user.findUnique({
      where: { login: data.login },
      include: { apiKeys: { where: { application: { id: applicationId } } } },
    });
    return { userId: user?.id, apiKeyId: user?.apiKeys?.[0]?.id, basicUserData: data };
  }

  /**
   * Decodes a register token to access the data it contains.
   * @param registerToken {@link RegisterUserData} that permits creating a user account, or null if the token format is invalid in any way.
   */
  decodeRegisterUserToken(registerToken: string): RegisterUserData | null {
    const data = this.jwt.decode(registerToken);
    if (
      !data ||
      !('login' in data) ||
      !('mail' in data) ||
      !('firstName' in data) ||
      !('lastName' in data) ||
      !('tokenExpiresIn' in data)
    ) {
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
    if (!data || !('userId' in data) || !('applicationId' in data) || !('tokenExpiresIn' in data)) {
      return null;
    }
    return omit(data, 'iat', 'exp') as RegisterApiKeyData;
  }

  /**
   *
   */
  decodeValidationToken(token: string): ValidationTokenData | null {
    const data = this.jwt.decode(token);
    if (!data || !('apiKeyId' in data) || !('tokenExpiresIn' in data) || !('applicationId' in data)) {
      return null;
    }
    return omit(data, 'iat', 'exp') as ValidationTokenData;
  }

  /**
   * Creates a token for user with the provided api key token.
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
   */
  signRegisterUserToken(
    login: string,
    mail: string,
    firstName: string,
    lastName: string,
    tokenExpiresIn: number,
  ): Promise<string> {
    return this.jwt.signAsync({ login, mail, firstName, lastName, tokenExpiresIn } satisfies RegisterUserData, {
      expiresIn: 60,
      secret: this.config.JWT_SECRET,
    });
  }

  /**
   * Creates a register token for the provided data. Returns that token.
   * When decoded, the returned token contains all the necessary information to register a new api key.
   */
  signRegisterApiKeyToken(userId: string, applicationId: string, tokenExpiresIn: number): Promise<string> {
    return this.jwt.signAsync({ userId, applicationId, tokenExpiresIn } satisfies RegisterApiKeyData, {
      expiresIn: 60,
      secret: this.config.JWT_SECRET,
    });
  }

  /**
   *
   */
  signValidationToken(apiKeyId: string, applicationId: string, tokenExpiresIn: number) {
    return this.jwt.signAsync({ apiKeyId, applicationId, tokenExpiresIn } satisfies ValidationTokenData, {
      expiresIn: 10,
      secret: this.config.JWT_SECRET,
    });
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
   * Creates an API Key, and returns it (with its token).
   */
  async createApiKey(userId: string, applicationId: string): Promise<RawApiKey> {
    return this.prisma.apiKey.create({
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
        token: AuthService.generateToken(),
      },
    });
  }

  /**
   * Generates a completely random string composed of 128 characters (in base64)
   * @private
   */
  static generateToken(): string {
    const tokenLength = 128;
    const token = crypto.randomBytes(tokenLength).toString('base64');
    return token.slice(0, tokenLength);
  }

  async signApiKey(apiKeyId: string, tokenExpiresIn: number, renewToken = true): Promise<string | null> {
    const apiKey = renewToken
      ? await this.prisma.apiKey.update({
          where: { id: apiKeyId },
          data: { token: AuthService.generateToken() },
        })
      : await this.prisma.apiKey.findUnique({ where: { id: apiKeyId } });
    if (!apiKey) return null;
    return this.signAuthenticationToken(apiKey.token, tokenExpiresIn);
  }
}
