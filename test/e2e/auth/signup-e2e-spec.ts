import AuthSignUpReqDto from '../../../src/auth/dto/req/auth-sign-up-req.dto';
import * as pactum from 'pactum';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { e2eSuite } from '../../utils/test_utils';
import { ERROR_CODE } from '../../../src/exceptions';
import { UserType } from '@prisma/client';
import { createUser } from '../../utils/fakedb';
import { JwtService } from '@nestjs/jwt';

const SignupE2ESpec = e2eSuite('POST /auth/signup', (app) => {
  const dto = {
    login: 'testLogin',
    password: 'testPassword',
    firstName: 'testFirstName',
    lastName: 'testLastName',
    studentId: 44250,
    sex: 'OTHER',
    birthday: new Date('1999-01-01'),
    tokenExpiresIn: 1000,
  } as AuthSignUpReqDto;

  it('should return a 400 if login is missing', async () => {
    return pactum
      .spec()
      .post('/auth/signup')
      .withBody({ ...dto, login: undefined })
      .expectAppError(ERROR_CODE.PARAM_MISSING, 'login');
  });
  it('should return a 400 if login is not alphanumeric', async () => {
    return pactum
      .spec()
      .post('/auth/signup')
      .withBody({ ...dto, login: 'my/login_1' })
      .expectAppError(ERROR_CODE.PARAM_NOT_ALPHANUMERIC, 'login');
  });
  it('should return a 400 if password is missing', async () => {
    return pactum
      .spec()
      .post('/auth/signup')
      .withBody({ ...dto, password: undefined })
      .expectAppError(ERROR_CODE.PARAM_MISSING, 'password');
  });
  it('should return a 400 if lastName is missing', async () => {
    return pactum
      .spec()
      .post('/auth/signup')
      .withBody({ ...dto, lastName: undefined })
      .expectAppError(ERROR_CODE.PARAM_MISSING, 'lastName');
  });
  it('should return a 400 if firstName is missing', async () => {
    return pactum
      .spec()
      .post('/auth/signup')
      .withBody({ ...dto, firstName: undefined })
      .expectAppError(ERROR_CODE.PARAM_MISSING, 'firstName');
  });
  it('should return a 400 if studentId is not a number', async () => {
    return pactum
      .spec()
      .post('/auth/signup')
      .withBody({ ...dto, studentId: 'this is a string' })
      .expectAppError(ERROR_CODE.PARAM_NOT_NUMBER, 'studentId');
  });
  it('should return a 400 if studentId is not positive', async () => {
    return pactum
      .spec()
      .post('/auth/signup')
      .withBody({ ...dto, studentId: -1 })
      .expectAppError(ERROR_CODE.PARAM_NOT_POSITIVE, 'studentId');
  });
  it('should return a 400 if sex is not one of MALE, FEMALE or OTHER is not provided', async () => {
    return pactum
      .spec()
      .post('/auth/signup')
      .withBody({ ...dto, sex: 'neither of these' })
      .expectAppError(ERROR_CODE.PARAM_NOT_ENUM, 'sex');
  });
  it('should return a 400 if birthday is not a date', async () => {
    return pactum
      .spec()
      .post('/auth/signup')
      .withBody({
        ...dto,
        birthday: 'My birthday is on the 32nd of February',
      })
      .expectAppError(ERROR_CODE.PARAM_NOT_DATE, 'birthday');
  });
  it('should return a 400 if no body is provided', async () => {
    return pactum
      .spec()
      .post('/auth/signup')
      .withBody(undefined)
      .expectAppError(ERROR_CODE.PARAM_MISSING, 'firstName, lastName, login, password');
  });
  it('should create a new user', async () => {
    await pactum
      .spec()
      .post('/auth/signup')
      .withBody(dto)
      .expectStatus(201)
      .expect(async (ctx) => {
        expect(ctx.res.json['access_token']).toBeDefined();
        const token = app().get(JwtService).decode(ctx.res.json['access_token']).token;
        const apiKey = await app()
          .get(PrismaService)
          .apiKey.findFirst({ where: { user: { login: dto.login } } });
        expect(token).toEqual(apiKey.token);
      });
    const user = await app()
      .get(PrismaService)
      .user.findUnique({ where: { login: dto.login } });
    expect(user).not.toBeNull();
    expect(user.login).toEqual(dto.login);
    expect(user.firstName).toEqual(dto.firstName);
    expect(user.lastName).toEqual(dto.lastName);
    expect(user.studentId).toEqual(dto.studentId);
    expect(user.infos.sex).toEqual(dto.sex);
    expect(user.infos.birthday).toEqual(dto.birthday);
    expect(user.userType).toEqual(UserType.OTHER);
    expect(user.id).toMatch(/[a-z0-9-]{36}/);
    await app()
      .get(PrismaService)
      .user.delete({ where: { id: user.id } });
  });

  it('should fail as the credentials are already used', async () => {
    const user = await createUser(app, { login: dto.login }, true);
    await pactum.spec().post('/auth/signup').withBody(dto).expectAppError(ERROR_CODE.CREDENTIALS_ALREADY_TAKEN);
    await app()
      .get(PrismaService)
      .user.delete({ where: { id: user.id } });
  });
});

export default SignupE2ESpec;
