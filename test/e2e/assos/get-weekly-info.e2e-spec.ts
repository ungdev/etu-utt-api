import { e2eSuite } from '../../utils/test_utils';
import { createUser } from '../../utils/fakedb';
import * as pactum from 'pactum';
import { ERROR_CODE } from '../../../src/exceptions';
import { ConfigModule } from '../../../src/config/config.module';

const GetWeeklyInfoE2ESpec = e2eSuite('GET /assos/weekly/info', (app) => {
  const user = createUser(app);

  it('should return 401 as user is not authenticated', () =>
    pactum.spec().get('/assos/weekly/info').expectAppError(ERROR_CODE.NOT_LOGGED_IN));

  it('should successfully return information about weeklies', () =>
    pactum
      .spec()
      .withBearerToken(user.token)
      .get('/assos/weekly/info')
      .expectJson({ sendDay: app().get(ConfigModule).WEEKLY_SEND_DAY, sendHour: app().get(ConfigModule).WEEKLY_SEND_HOUR }));
});

export default GetWeeklyInfoE2ESpec;
