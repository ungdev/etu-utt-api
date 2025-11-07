import { e2eSuite, JsonLike } from '../../../utils/test_utils';
import * as pactum from 'pactum';
import { ERROR_CODE } from '../../../../src/exceptions';
import * as fakedb from '../../../utils/fakedb';

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
      .created()
      .expectStatus()
      .$expectRegexableJson({
        id: JsonLike.UUID,
        name: body.name,
        owner: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        redirectUrl: body.redirectUrl,
        clientSecret: JsonLike.STRING,
      }));
});

export default CreateApplicationE2ESpec;
