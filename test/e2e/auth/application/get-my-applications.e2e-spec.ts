import { e2eSuite } from '../../../utils/test_utils';
import * as pactum from 'pactum';
import { ERROR_CODE } from '../../../../src/exceptions';
import * as fakedb from '../../../utils/fakedb';

const GetMyApplicationsE2ESpec = e2eSuite('GET /auth/application/of/me', (app) => {
  const user = fakedb.createUser(app);
  const applications = [fakedb.createApplication(app, { owner: user }), fakedb.createApplication(app, { owner: user })];

  it('should return an Unauthorized as user is not logged in', () =>
    pactum.spec().get('/auth/application/of/me').expectAppError(ERROR_CODE.NOT_LOGGED_IN));

  it('should return the applications of the user', () =>
    pactum.spec().get('/auth/application/of/me').withBearerToken(user.token).expectApplications(applications));
});

export default GetMyApplicationsE2ESpec;
