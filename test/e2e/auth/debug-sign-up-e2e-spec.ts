import AuthSignUpDebugReqDto from '../../../src/auth/dto/req/auth-sign-up-debug-req.dto';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { buildTestApp, E2EApp, e2eSuite } from '../../utils/test_utils';
import { ERROR_CODE } from '../../../src/exceptions';
import { UserType } from '@prisma/client';
import { createUser } from '../../utils/fakedb';
import { JwtService } from '@nestjs/jwt';

const DebugSignUpE2ESpec = e2eSuite('POST (/vdev)/auth/signup', (app) => {
  const dto = {
    login: 'testLogin',
    firstName: 'testFirstName',
    lastName: 'testLastName',
    tokenExpiresIn: 1000,
  } as AuthSignUpDebugReqDto;

  it('should not exist in a production environment', async () => {
    let prodApp: E2EApp;
    try {
      process.env.NODE_ENV = 'production';
      prodApp = await buildTestApp(3002);
      await prodApp
        .spec()
        .withVersion('dev')
        .post('/auth/signup')
        .expectAppError(ERROR_CODE.NOT_FOUND);
    } finally {
      process.env.NODE_END = 'test';
      await prodApp.close();
    }
  });

  it('should return a 400 if login is missing', async () => {
    return app()
      .spec()
      .withVersion('dev')
      .post('/auth/signup')
      .withBody({ ...dto, login: undefined })
      .expectAppError(ERROR_CODE.PARAM_MISSING, 'login');
  });
  it('should return a 400 if login is not alphanumeric', async () => {
    return app()
      .spec()
      .withVersion('dev')
      .post('/auth/signup')
      .withBody({ ...dto, login: 'my/login_1' })
      .expectAppError(ERROR_CODE.PARAM_NOT_ALPHANUMERIC, 'login');
  });
  it('should return a 400 if lastName is missing', async () => {
    return app()
      .spec()
      .withVersion('dev')
      .post('/auth/signup')
      .withBody({ ...dto, lastName: undefined })
      .expectAppError(ERROR_CODE.PARAM_MISSING, 'lastName');
  });
  it('should return a 400 if firstName is missing', async () => {
    return app()
      .spec()
      .withVersion('dev')
      .post('/auth/signup')
      .withBody({ ...dto, firstName: undefined })
      .expectAppError(ERROR_CODE.PARAM_MISSING, 'firstName');
  });
  it('should return a 400 if no body is provided', async () => {
    return app()
      .spec()
      .withVersion('dev')
      .post('/auth/signup')
      .withBody(undefined)
      .expectAppError(ERROR_CODE.BODY_MISSING);
  });
  it('should create a new user', async () => {
    await app()
      .spec()
      .withVersion('dev')
      .post('/auth/signup')
      .withBody(dto)
      .expectStatus(201)
      .expect(async (ctx) => {
        expect(ctx.res.json['token']).toBeDefined();
        const token = app().get(JwtService).decode(ctx.res.json['token']).token;
        const apiKey = await app()
          .get(PrismaService)
          .apiKey.findFirst({ where: { user: { login: dto.login } } });
        expect(token).toEqual(apiKey.token);
      });
    const user = await app()
      .get(PrismaService)
      .normalize.user.findUnique({ where: { login: dto.login } });
    expect(user).not.toBeNull();
    expect(user.login).toEqual(dto.login);
    expect(user.firstName).toEqual(dto.firstName);
    expect(user.lastName).toEqual(dto.lastName);
    expect(user.userType).toEqual(UserType.OTHER);
    expect(user.id).toMatch(/[a-z0-9-]{36}/);
    await app()
      .get(PrismaService)
      .user.delete({ where: { id: user.id } });
  });

  it('should fail as the credentials are already used', async () => {
    const user = await createUser(app, { login: dto.login }, true);
    await app().spec()
      .withVersion('dev')
      .post('/auth/signup')
      .withBody(dto)
      .expectAppError(ERROR_CODE.CREDENTIALS_ALREADY_TAKEN);
    await app()
      .get(PrismaService)
      .user.delete({ where: { id: user.id } });
  });
});

export default DebugSignUpE2ESpec;
