import { e2eSuite } from '../../utils/test_utils';
import * as pactum from 'pactum';
import { faker } from '@faker-js/faker';
import { HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as fakedb from '../../utils/fakedb';
import { AuthService, RegisterData } from '../../../src/auth/auth.service';
import { pick } from '../../../src/utils';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { FakeUser } from '../../utils/fakedb';
import { string } from 'pactum-matchers';
import { ERROR_CODE } from '../../../src/exceptions';
import { ConfigService } from '@nestjs/config';

const CasSignUpE2ESpec = e2eSuite('/auth/signup/cas', (app) => {
  it('should fail as the provided token is not jwt-generated', () =>
    pactum
      .spec()
      .post('/auth/signup/cas')
      .withJson({ registerToken: faker.random.alpha() })
      .expectAppError(ERROR_CODE.INVALID_TOKEN_FORMAT));

  it('should fail as the provided token does not contains an object in the right form', async () => {
    const token = app()
      .get(JwtService)
      .sign({ a: 'b' }, { expiresIn: 60, secret: app().get(ConfigService).get('JWT_SECRET') });
    pactum.spec().post('/auth/signup/cas').withJson({ registerToken: token }).expectAppError(ERROR_CODE.INVALID_TOKEN_FORMAT);
  });

  it('should fail as the user already exists', async () => {
    const user = await fakedb.createUser(app, {}, true);
    await pactum
      .spec()
      .post('/auth/signup/cas')
      .withJson({
        registerToken: app()
          .get(AuthService)
          .signRegisterToken({
            ...pick(user as Required<FakeUser>, 'login', 'firstName', 'lastName'),
            mail: faker.internet.email(),
          }),
      })
      .expectAppError(ERROR_CODE.CREDENTIALS_ALREADY_TAKEN);
    await app()
      .get(PrismaService)
      .user.delete({ where: { id: user.id } });
  });

  it('should successfully create the user and return a token', async () => {
    const userData: RegisterData = {
      login: faker.internet.userName(),
      mail: faker.internet.email(),
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
    };
    await pactum
      .spec()
      .post('/auth/signup/cas')
      .withJson({ registerToken: app().get(AuthService).signRegisterToken(userData) })
      .expectJsonMatch({ access_token: string() });
  });
});

export default CasSignUpE2ESpec;
