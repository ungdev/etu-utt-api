import * as pactum from 'pactum';
import { AuthSignInDto, AuthSignUpDto } from '../../src/auth/dto';

export function AuthE2ESpec() {
  describe('Auth', () => {
    describe('Signup', () => {
      const dto: AuthSignUpDto = {
        login: 'testLogin',
        password: 'testPassword',
        firstName: 'testFirstName',
        lastName: 'testLastName',
        studentId: 44250,
      };
      it('should return a 400 if login is missing', async () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ ...dto, login: undefined })
          .expectStatus(400);
      });
      it('should return a 400 if login is not alphanumeric', async () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ ...dto, login: 'my/login_1' })
          .expectStatus(400);
      });
      it('should return a 400 if password is missing', async () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ ...dto, password: undefined })
          .expectStatus(400);
      });
      it('should return a 400 if lastName is missing', async () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ ...dto, lastName: undefined })
          .expectStatus(400);
      });
      it('should return a 400 if firstName is missing', async () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ ...dto, firstName: undefined })
          .expectStatus(400);
      });
      it('should return a 400 if studentId is not a number', async () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ ...dto, studentId: 'this is a string' })
          .expectStatus(400);
      });
      it('should return a 400 if studentId is not positive', async () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ ...dto, studentId: -1 })
          .expectStatus(400);
      });
      it('should return a 400 if no body is provided', async () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(undefined)
          .expectStatus(400);
      });
      it('should create a new user', async () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(201);
      });
    });

    describe('Signin', () => {
      const dto: AuthSignInDto = {
        login: 'testLogin',
        password: 'testPassword',
      };
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
  });
}
