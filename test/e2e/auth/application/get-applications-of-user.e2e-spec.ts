import { e2eSuite } from '../../../utils/test_utils';
import * as pactum from 'pactum';
import { ERROR_CODE } from '../../../../src/exceptions';
import * as fakedb from '../../../utils/fakedb';
import { Permission } from '@prisma/client';

const GetApplicationsOfUserE2ESpec = e2eSuite('GET /auth/application/of/:userId', (app) => {
  const user = fakedb.createUser(app);
  const unauthorizedUser = fakedb.createUser(app);
  const adminUser = fakedb.createUser(app, { permissions: [Permission.USER_SEE_DETAILS] });
  const applications = [fakedb.createApplication(app, { owner: user }), fakedb.createApplication(app, { owner: user })];

  it('should return an Unauthorized as user is not logged in', () =>
    pactum.spec().get(`/auth/application/of/${user.id}`).expectAppError(ERROR_CODE.NOT_LOGGED_IN));

  it('should fail as the unauthorizedUser does not have the permissions to see the applications of user', () =>
    pactum
      .spec()
      .get(`/auth/application/of/${user.id}`)
      .withBearerToken(unauthorizedUser.token)
      .expectAppError(ERROR_CODE.FORBIDDEN_NOT_ENOUGH_USER_PERMISSIONS, Permission.USER_SEE_DETAILS, user.id));

  it('should return the applications of user as adminUser has the rights to see the permissions of user', () =>
    pactum
      .spec()
      .get(`/auth/application/of/${user.id}`)
      .withBearerToken(adminUser.token)
      .expectApplications(applications));
});

export default GetApplicationsOfUserE2ESpec;
