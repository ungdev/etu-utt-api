import { e2eSuite } from '#/utils/test_utils.js';
import * as pactum from 'pactum';
import * as fakedb from '#/utils/fakedb.js';
import { ERROR_CODE } from '@/exceptions.js';
import { Permission } from '@/prisma/types.js';
import { PermissionManager } from '@/utils.js';
import { it } from 'vitest';

const GetOwnPermissionsE2ESpec = e2eSuite('GET /auth/permissions/current', (app) => {
  const user = fakedb.createUser(app, {
    permissions: new PermissionManager().with(Permission.USER_SEE_DETAILS).with(Permission.API_UPLOAD_ANNALS),
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
          .with(Permission.API_UPLOAD_ANNALS)
          .with(Permission.USER_SEE_DETAILS)
          .with(Permission.USER_UPDATE_DETAILS, user.id),
      ));
});

export default GetOwnPermissionsE2ESpec;
