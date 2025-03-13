import { e2eSuite } from '../../../utils/test_utils';
import * as pactum from 'pactum';
import { ERROR_CODE } from '../../../../src/exceptions';
import * as fakedb from '../../../utils/fakedb';
import { HttpStatus } from '@nestjs/common';
import { string } from 'pactum-matchers';

const CreateApplicationE2ESpec = e2eSuite('POST /auth/application', (app) => {
  const user = fakedb.createUser(app);

  const body = {
    name: 'My App',
    redirectUrl: 'https://great-app.com',
  };

  it('should fail as user is not authenticated', () =>
    pactum.spec().post(`/auth/application`).withBody(body).expectAppError(ERROR_CODE.NOT_LOGGED_IN));

  it('should return the newly created application', () =>
    pactum
      .spec()
      .post(`/auth/application`)
      .withBearerToken(user.token)
      .withJson(body)
      .expectStatus(HttpStatus.CREATED)
      .expectJsonMatch({
        id: string(),
        name: body.name,
        userId: user.id,
        redirectUrl: body.redirectUrl,
      }));
});

export default CreateApplicationE2ESpec;
