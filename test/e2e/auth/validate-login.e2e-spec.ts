import * as pactum from 'pactum';
import { e2eSuite } from '../../utils/test_utils';
import { AuthService } from '../../../src/auth/auth.service';
import { ERROR_CODE } from '../../../src/exceptions';
import * as fakedb from '../../utils/fakedb';
import { string } from 'pactum-matchers';
import { HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { DEFAULT_APPLICATION } from '../../../prisma/seed/utils';
import { JwtService } from '@nestjs/jwt';

const ValidateLoginE2ESpec = e2eSuite('POST /auth/login/validate', (app) => {
  const authService = () => app().get(AuthService);
  const user = fakedb.createUser(app);
  const application = fakedb.createApplication(app, { owner: user });

  it('should return a 400 as the token is not valid', async () =>
    pactum
      .spec()
      .post('/auth/login/validate')
      .withJson({ token: 'this is definitely not the right format', clientSecret: DEFAULT_APPLICATION.clientSecret })
      .expectAppError(ERROR_CODE.INVALID_TOKEN_FORMAT));

  it('should fail as the application in the token is not the application used to make the request', async () =>
    pactum
      .spec()
      .post('/auth/login/validate')
      .withJson({
        token: await authService().signValidationToken(user.apiKey.id, DEFAULT_APPLICATION.id, 8080),
        clientSecret: DEFAULT_APPLICATION.clientSecret,
      })
      .withApplication(application.id)
      .expectAppError(ERROR_CODE.INCONSISTENT_APPLICATION));

  it('should fail as the client secret has the wrong value', async () =>
    pactum
      .spec()
      .post('/auth/login/validate')
      .withJson({
        token: await authService().signValidationToken(user.apiKey.id, DEFAULT_APPLICATION.id, 99999),
        clientSecret: 'i am wrong :devil:',
      })
      .expectAppError(ERROR_CODE.INVALID_TOKEN_FORMAT));

  it('should return a bearer token', async () => {
    await pactum
      .spec()
      .post('/auth/login/validate')
      .withJson({
        token: await authService().signValidationToken(user.apiKey.id, DEFAULT_APPLICATION.id, 9999),
        clientSecret: DEFAULT_APPLICATION.clientSecret,
      })
      .expectStatus(HttpStatus.OK)
      .expectJsonMatch({ token: string() })
      .expect(async (ctx) => {
        const body = ctx.res.json as { token: string };
        const registerData = app().get(JwtService).decode(body.token);
        const { token: expectedToken } = await app()
          .get(PrismaService)
          .withDefaultBehaviour.apiKey.findUnique({ where: { id: user.apiKey.id } });
        expect(registerData).toBeTruthy();
        expect(registerData.token).toEqual(expectedToken);
        expect(expectedToken).not.toEqual(user.apiKey.token);
        user.apiKey.token = expectedToken;
      });
  });
});

export default ValidateLoginE2ESpec;
