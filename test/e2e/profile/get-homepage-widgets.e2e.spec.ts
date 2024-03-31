import { e2eSuite } from '../../utils/test_utils';
import * as pactum from 'pactum';
import { ERROR_CODE } from '../../../src/exceptions';
import * as fakedb from '../../utils/fakedb';

const GetHomepageWidgetsE2ESpec = e2eSuite('GET /profile/homepage', (app) => {
  const user = fakedb.createUser(app);
  const widgets = [fakedb.createHomepageWidget(app, { user }), fakedb.createHomepageWidget(app, { user })];

  it('should return a 401 if we are not logged in', async () => {
    return pactum.spec().get('/profile/homepage').expectAppError(ERROR_CODE.NOT_LOGGED_IN);
  });

  it('should return a 200 with the widgets if we are logged in', async () => {
    return pactum.spec().withBearerToken(user.token).get('/profile/homepage').expectHomepageWidgets(widgets);
  });
});

export default GetHomepageWidgetsE2ESpec;
