import AuthSignInDto from '../../../src/auth/dto/req/auth-sign-in-req.dto';
import * as pactum from 'pactum';
import { e2eSuite } from '../../utils/test_utils';
import * as fakedb from '../../utils/fakedb';
import { ERROR_CODE } from '../../../src/exceptions';

const SignInE2ESpec = e2eSuite('POST /auth/signin', (app) => {
  const dto = {
    login: 'testLogin',
    password: 'testPassword',
    tokenExpiresIn: 1000,
  } as AuthSignInDto;

  fakedb.createUser(app, dto);

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

  it('should return a token for a valid user', () =>
    pactum.spec().post('/auth/signin').withBody(dto).expectStatus(200).expectBodyContains('access_token'));
});

export default SignInE2ESpec;
