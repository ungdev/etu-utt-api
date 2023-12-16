import { AuthSignInDto } from '../../../src/auth/dto';
import * as pactum from 'pactum';
import { e2eSuite } from '../../test_utils';
import { AuthService } from '../../../src/auth/auth.service';

const SignInE2ESpec = e2eSuite('Signin', (app) => {
  const dto = {
    login: 'testLogin',
    password: 'testPassword',
  } as AuthSignInDto;

  beforeAll(async () => {
    await app()
      .get(AuthService)
      .signup({
        login: dto.login,
        studentId: 99999,
        sex: 'MALE',
        firstName: 'patrick',
        lastName: 'sebastien',
        password: dto.password,
        birthday: new Date(Date.now()),
      });
  });

  it('should return a 400 if login is missing', async () => {
    return pactum
      .spec()
      .post('/auth/signin')
      .withBody({ ...dto, login: undefined })
      .expectStatus(400);
  });

  it('should return a 400 if login is not alphanumeric', async () => {
    return pactum
      .spec()
      .post('/auth/signin')
      .withBody({ ...dto, login: 'my/login_1' })
      .expectStatus(400);
  });

  it('should return a 400 if password is missing', async () => {
    return pactum
      .spec()
      .post('/auth/signin')
      .withBody({ ...dto, password: undefined })
      .expectStatus(400);
  });

  it('should return a 400 if no body is provided', async () => {
    return pactum
      .spec()
      .post('/auth/signin')
      .withBody(undefined)
      .expectStatus(400);
  });

  it('should return a token for a valid user', () => {
    return pactum
      .spec()
      .post('/auth/signin')
      .withBody(dto)
      .expectStatus(200)
      .expectBodyContains('access_token')
      .stores('userAccessToken', 'access_token');
  });
});

export default SignInE2ESpec;
