import { e2eSuite } from '../../utils/test_utils';
import { createUser } from '../../utils/fakedb';
import * as pactum from 'pactum';
import { ERROR_CODE } from '../../../src/exceptions';
import { ConfigModule } from '../../../src/config/config.module';

const GetDaymailInfoE2ESpec = e2eSuite('GET /assos/daymail/info', (app) => {
  const user = createUser(app);

  it('should return 403 as user is not authenticated', () =>
    pactum.spec().get('/assos/daymail/info').expectAppError(ERROR_CODE.NOT_LOGGED_IN));

  it('should successfully create a new daymail', () =>
    pactum
      .spec()
      .withBearerToken(user.token)
      .get('/assos/daymail/info')
      .expectJson({ sendDay: app().get(ConfigModule).DAYMAIL_SEND_DAY, sendHour: app().get(ConfigModule).DAYMAIL_SEND_HOUR }));
});

export default GetDaymailInfoE2ESpec;
