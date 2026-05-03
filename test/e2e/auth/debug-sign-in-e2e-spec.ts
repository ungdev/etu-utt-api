import AuthSignInDebugReqDto from '../../../src/auth/dto/req/auth-sign-in-debug-req.dto';
import * as pactum from 'pactum';
import { buildTestApp, E2EApp, e2eSuite, JsonLike } from '../../utils/test_utils';
import * as fakedb from '../../utils/fakedb';
import { ERROR_CODE } from '../../../src/exceptions';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { DEFAULT_APPLICATION } from '../../../prisma/seed/utils';
import { AuthService } from '../../../src/auth/auth.service';

const DebugSignInE2ESpec = e2eSuite('POST (/vdev)/auth/signin', (app) => {
  const dto = {
    login: 'testLogin',
    tokenExpiresIn: 1000,
  } as AuthSignInDebugReqDto;

  const user = fakedb.createUser(app, dto);
  const userWithApplication = fakedb.createUser(app, { login: 'thisisalphanumeric' });
  const application = fakedb.createApplication(app, { owner: userWithApplication });

  // TODO: Deactivated, because for some reason it leaves a hanging promise
  it.skip('should not exist in a production environment', async () => {
    let prodApp: E2EApp;
    try {
      process.env.NODE_ENV = 'production';
      prodApp = await buildTestApp(3002);
      await prodApp
        .spec()
        .withVersion('dev')
        .post('/auth/signin')
        .expectAppError(ERROR_CODE.NOT_FOUND);
    } finally {
      process.env.NODE_ENV = 'test';
      await prodApp.close();
    }
  });

  it('should return a 400 if login is missing', async () =>
    pactum
      .spec()
      .withVersion('dev')
      .post('/auth/signin')
      .withBody({ ...dto, login: undefined })
      .expectAppError(ERROR_CODE.PARAM_MISSING, 'login'));

  it('should return a 400 if login is not alphanumeric', async () =>
    pactum
      .spec()
      .withVersion('dev')
      .post('/auth/signin')
      .withBody({ ...dto, login: 'my/login_1' })
      .expectAppError(ERROR_CODE.PARAM_NOT_ALPHANUMERIC, 'login'));

  it('should return a 400 if no body is provided', async () =>
    pactum.spec().post('/auth/signin').expectAppError(ERROR_CODE.BODY_MISSING));

  it('should return a token for a valid user as the application is the EtuUTT website', () =>
    pactum
      .spec()
      .withVersion('dev')
      .post('/auth/signin')
      .withBody(dto)
      .$expectRegexableJson({
        signedIn: true,
        token: JsonLike.STRING,
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
      .withVersion('dev')
      .post('/auth/signin')
      .withApplication(application.id)
      .withBody({ login: userWithApplication.login, tokenExpiresIn: 99999 })
      .$expectRegexableJson({
        signedIn: true,
        token: null,
        redirectUrl: JsonLike.STRING,
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
      .withVersion('dev')
      .post('/auth/signin')
      .withApplication(application.id)
      .withBody(dto)
      .$expectRegexableJson({
        signedIn: false,
        token: JsonLike.STRING,
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

export default DebugSignInE2ESpec;
