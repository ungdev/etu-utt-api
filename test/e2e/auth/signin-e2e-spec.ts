import AuthSignInDto from '../../../src/auth/dto/req/auth-sign-in-req.dto';
import * as pactum from 'pactum';
import { e2eSuite } from '../../utils/test_utils';
import * as fakedb from '../../utils/fakedb';
import { ERROR_CODE } from '../../../src/exceptions';
import { string } from 'pactum-matchers';
import { JwtService } from '@nestjs/jwt';
import * as cas from '../../external_services/cas';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { DEFAULT_APPLICATION } from '../../../prisma/seed/utils';
import { pick } from '../../../src/utils';
import { AuthService } from '../../../src/auth/auth.service';

const SignInE2ESpec = e2eSuite('POST /auth/signin', (app) => {
  const dto = {
    login: 'testLogin',
    password: 'testPassword',
    tokenExpiresIn: 1000,
  } as AuthSignInDto;

  const user = fakedb.createUser(app, dto);
  const userWithApplication = fakedb.createUser(app, { login: 'thisisalphanumeric', password: 'etuutt' });
  const application = fakedb.createApplication(app, { owner: userWithApplication });

  it('should return a 400 if login is missing', async () =>
    pactum
      .spec()
      .post('/auth/signin')
      .withBody({ ...dto, login: undefined })
      .expectAppError(ERROR_CODE.PARAM_MISSING, 'login'));

  it('should return a 400 if login is not alphanumeric', async () =>
    pactum
      .spec()
      .post('/auth/signin')
      .withBody({ ...dto, login: 'my/login_1' })
      .expectAppError(ERROR_CODE.PARAM_NOT_ALPHANUMERIC, 'login'));

  it('should return a 400 if password is missing', async () =>
    pactum
      .spec()
      .post('/auth/signin')
      .withBody({ ...dto, password: undefined })
      .expectAppError(ERROR_CODE.PARAM_MISSING, 'password'));

  it('should return a 400 if no body is provided', async () =>
    pactum.spec().post('/auth/signin').withBody(undefined).expectAppError(ERROR_CODE.PARAM_MISSING, 'login, password'));

  it('should return a token for a valid user as the application is the EtuUTT website', () =>
    pactum
      .spec()
      .post('/auth/signin')
      .withBody(dto)
      .expectStatus(200)
      .expectJsonMatch({
        signedIn: true,
        token: string(),
        redirectUrl: null,
      })
      .expect(async (ctx) => {
        const token = ctx.res.json['token'] as string;
        const jwt = app().get(JwtService);
        const data = jwt.decode(token);
        const apiKey = await app()
          .get(PrismaService)
          .apiKey.findUnique({
            where: {
              userId_applicationId: {
                userId: user.id,
                applicationId: DEFAULT_APPLICATION.id,
              },
            },
          });
        expect(data).toMatchObject({ token: apiKey.token });
        user.token = token;
        user.apiKey = apiKey;
      }));

  it('should return a redirection URL for a valid user as the application is not the EtuUTT website', () =>
    pactum
      .spec()
      .post('/auth/signin')
      .withApplication(application.id)
      .withBody({ login: userWithApplication.login, password: 'etuutt', tokenExpiresIn: 99999 })
      .expectStatus(200)
      .expectJsonMatch({
        signedIn: true,
        token: null,
        redirectUrl: string(),
      })
      .expect(async (ctx) => {
        const redirectUrl = ctx.res.json['redirectUrl'] as string;
        expect(redirectUrl.startsWith(application.redirectUrl)).toBeTruthy();
        const registerData = app()
          .get(AuthService)
          .decodeValidationToken(redirectUrl.match(/token=([^&]+)/)[1]);
        expect(registerData).toBeTruthy();
        expect(registerData.applicationId).toEqual(application.id);
        expect(registerData.tokenExpiresIn).toEqual(99999);
      }));

  it("should return a token to ask the user to confirm they want to create an api key for an application for which they don't have one", () =>
    pactum
      .spec()
      .post('/auth/signin')
      .withApplication(application.id)
      .withBody(dto)
      .expectStatus(200)
      .expectJsonMatch({
        signedIn: false,
        token: string(),
        redirectUrl: null,
      })
      .expect(async (ctx) => {
        const token = ctx.res.json['token'] as string;
        const tokenData = app().get(AuthService).decodeRegisterApiKeyToken(token);
        expect(tokenData).toEqual({
          userId: user.id,
          applicationId: application.id,
          tokenExpiresIn: dto.tokenExpiresIn,
        });
      }));
});

export default SignInE2ESpec;
