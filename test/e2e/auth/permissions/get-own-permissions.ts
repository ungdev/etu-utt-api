import { e2eSuite } from '../../../utils/test_utils';
import * as pactum from 'pactum';
import * as fakedb from '../../../utils/fakedb';
import { ERROR_CODE } from '../../../../src/exceptions';
import { Permission } from '@prisma/client';
import { PermissionManager } from '../../../../src/utils';

const GetOwnPermissionsE2ESpec = e2eSuite('GET /auth/permissions/current', (app) => {
  const user = fakedb.createUser(app, {
    permissions: new PermissionManager().add(Permission.USER_SEE_DETAILS).add(Permission.API_UPLOAD_ANNALS),
  });

  it('must fail as user is not authenticated', () =>
    pactum.spec().get('/auth/permissions/current').expectAppError(ERROR_CODE.NOT_LOGGED_IN));

  it('must return the permission of the API key used to make the request', () =>
    pactum
      .spec()
      .withBearerToken(user.token)
      .get('/auth/permissions/current')
      .expectPermissions(
        new PermissionManager()
          .add(Permission.API_UPLOAD_ANNALS)
          .add(Permission.USER_SEE_DETAILS)
          .add(Permission.USER_UPDATE_DETAILS, user.id),
      ));
});

export default GetOwnPermissionsE2ESpec;
