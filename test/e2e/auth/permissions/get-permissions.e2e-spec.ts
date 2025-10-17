import { e2eSuite } from '../../../utils/test_utils';
import * as pactum from 'pactum';
import * as fakedb from '../../../utils/fakedb';
import { ERROR_CODE } from '../../../../src/exceptions';
import { Permission } from '@prisma/client';
import { PermissionManager } from '../../../../src/utils';

const GetPermissionsE2ESpec = e2eSuite('GET /auth/permissions/:apiKey', (app) => {
  const loggedUser = fakedb.createUser(app);
  const user = fakedb.createUser(app, {
    permissions: new PermissionManager().with(Permission.USER_SEE_DETAILS).with(Permission.API_UPLOAD_ANNALS),
  });

  it('must fail as user is not authenticated', () =>
    pactum.spec().get(`/auth/permissions/${user.apiKey.id}`).expectAppError(ERROR_CODE.NOT_LOGGED_IN));

  it('must fail as the provided api key does not exist', () =>
    pactum
      .spec()
      .withBearerToken(loggedUser.token)
      .get(`/auth/permissions/blablabla`)
      .expectAppError(ERROR_CODE.NO_SUCH_API_KEY, 'blablabla'));

  it('must return the permission of the given API key', () =>
    pactum
      .spec()
      .withBearerToken(loggedUser.token)
      .get(`/auth/permissions/${user.apiKey.id}`)
      .expectPermissions(
        new PermissionManager()
          .with(Permission.API_UPLOAD_ANNALS)
          .with(Permission.USER_SEE_DETAILS)
          .with(Permission.USER_UPDATE_DETAILS, user.id),
      ));
});

export default GetPermissionsE2ESpec;
