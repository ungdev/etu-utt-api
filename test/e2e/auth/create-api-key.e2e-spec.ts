import * as pactum from 'pactum';
import { e2eSuite } from '../../utils/test_utils';
import { AuthService } from '../../../src/auth/auth.service';
import { ERROR_CODE } from '../../../src/exceptions';
import * as fakedb from '../../utils/fakedb';
import { string } from 'pactum-matchers';
import { pick } from '../../../src/utils';
import { HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../src/prisma/prisma.service';

const CreateApiKeyE2ESpec = e2eSuite('POST /auth/api-key', (app) => {
  const authService = () => app().get(AuthService);
  const user = fakedb.createUser(app);
  const application = fakedb.createApplication(app, { user });
  const otherUser = fakedb.createUser(app);

  it('should return a 400 as the token is not valid', async () =>
    pactum
      .spec()
      .post('/auth/api-key')
      .withJson({ token: 'this is definitely not the right format' })
      .expectAppError(ERROR_CODE.INVALID_TOKEN_FORMAT));

  it('should fail as the user in the token does not exist (happens if user deleted his account between the token generation and now)', async () =>
    pactum
      .spec()
      .post('/auth/api-key')
      .withJson({ token: await authService().signRegisterApiKeyToken("I don't exist", application.id, 99999) })
      .expectAppError(ERROR_CODE.NO_SUCH_USER, "I don't exist"));

  it('should fail as the applicationId in the token does not exist (happens if application has been deleted between the token generation and now)', async () =>
    pactum
      .spec()
      .post('/auth/api-key')
      .withJson({ token: await authService().signRegisterApiKeyToken(otherUser.id, "I don't exist", 99999) })
      .expectAppError(ERROR_CODE.NO_SUCH_APPLICATION, "I don't exist"));

  it('should return a redirection url', async () => {
    await pactum
      .spec()
      .post('/auth/api-key')
      .withJson({ token: await authService().signRegisterApiKeyToken(otherUser.id, application.id, 99999) })
      .expectStatus(HttpStatus.CREATED)
      .expectJsonMatch({ redirectUrl: string() })
      .expect((ctx) => {
        const body = ctx.res.json as { redirectUrl: string };
        expect(body.redirectUrl.startsWith(application.redirectUrl)).toBeTruthy();
        const registerData = authService().decodeValidationToken(body.redirectUrl.match(/token=([^&]+)/)[1]);
        expect(registerData).toBeTruthy();
        expect(pick(registerData, 'clientSecret', 'applicationId')).toEqual({
          clientSecret: application.clientSecret,
          applicationId: application.id,
        });
      });
    await app()
      .get(PrismaService)
      .withDefaultBehaviour.apiKey.delete({
        where: { userId_applicationId: { userId: otherUser.id, applicationId: application.id } },
      });
  });
});

export default CreateApiKeyE2ESpec;
