import { e2eSuite } from '../../../utils/test_utils';
import * as pactum from 'pactum';
import { ERROR_CODE } from '../../../../src/exceptions';
import * as fakedb from '../../../utils/fakedb';
import { HttpStatus } from '@nestjs/common';
import { string } from 'pactum-matchers';

const UpdateClientSecretE2ESpec = e2eSuite('PATCH /auth/application/:applicationId/client-secret', (app) => {
  const user = fakedb.createUser(app);
  const otherUser = fakedb.createUser(app);
  const application = fakedb.createApplication(app, { owner: user });

  it('should fail as user is not authenticated', () =>
    pactum.spec().patch(`/auth/application/${application.id}/client-secret`).expectAppError(ERROR_CODE.NOT_LOGGED_IN));

  it('should fail as the application does not exist', () =>
    pactum
      .spec()
      .patch(`/auth/application/ABCDEF/client-secret`)
      .withBearerToken(user.token)
      .expectAppError(ERROR_CODE.NO_SUCH_APPLICATION, 'ABCDEF'));

  it('should fail as user is not the owner of the application', () =>
    pactum.spec().patch(`/auth/application/${application.id}/client-secret`).withBearerToken(otherUser.token).expectAppError(ERROR_CODE.APPLICATION_NOT_OWNED, application.id));

  it('should return a new client secret', () =>
    pactum
      .spec()
      .patch(`/auth/application/${application.id}/client-secret`)
      .withBearerToken(user.token)
      .expectStatus(HttpStatus.OK)
      .expectJsonMatch({
        clientSecret: string(),
      }));
});

export default UpdateClientSecretE2ESpec;
