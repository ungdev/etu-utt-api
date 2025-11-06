import { Dummies, e2eSuite } from '../../utils/test_utils';
import {
  createAsso, createAssoDaymail,
  createAssoMembership,
  createAssoMembershipPermission,
  createAssoMembershipRole,
  createUser,
} from '../../utils/fakedb';
import * as pactum from 'pactum';
import { ERROR_CODE } from '../../../src/exceptions';

const DeleteDaymailE2ESpec = e2eSuite('DELETE /assos/:assoId/daymail/:daymailId', (app) => {
  const userWithPermission = createUser(app);
  const userWithoutPermission = createUser(app);
  const permissionManageAsso = createAssoMembershipPermission(app, { id: 'manage_asso' });

  const asso = createAsso(app);
  const role = createAssoMembershipRole(app, { asso });
  createAssoMembership(app, { asso, user: userWithPermission, role, permissions: [permissionManageAsso] });
  const daymail = createAssoDaymail(app, { asso }, { sendDates: [new Date(Date.UTC(2025, 9, 5))] });

  const otherAsso = createAsso(app);
  const otherAssoRole = createAssoMembershipRole(app, { asso });
  createAssoMembership(app, { asso: otherAsso, user: userWithPermission, role: otherAssoRole, permissions: [permissionManageAsso] });

  it('should return 403 as user is not authenticated', () =>
    pactum.spec().delete(`/assos/${asso.id}/daymail/${daymail.id}`).expectAppError(ERROR_CODE.NOT_LOGGED_IN));

  it('should return a 404 as asso is not found', () =>
    pactum
      .spec()
      .withBearerToken(userWithPermission.token)
      .delete(`/assos/${Dummies.UUID}/daymail/${daymail.id}`)
      .expectAppError(ERROR_CODE.NO_SUCH_ASSO, Dummies.UUID));

  it('should return a 404 as daymail is not found', () => pactum
    .spec()
    .withBearerToken(userWithPermission.token)
    .delete(`/assos/${asso.id}/daymail/${Dummies.UUID}`)
    .expectAppError(ERROR_CODE.NO_SUCH_DAYMAIL, Dummies.UUID))

  it('should return a 404 as the daymail does not belong to the asso', () => pactum
    .spec()
    .withBearerToken(userWithPermission.token)
    .delete(`/assos/${otherAsso.id}/daymail/${daymail.id}`)
    .expectAppError(ERROR_CODE.NO_SUCH_DAYMAIL, daymail.id));

  it('should return a 403 as user does not have the permission to update the daymails', () => pactum
    .spec()
    .withBearerToken(userWithoutPermission.token)
    .delete(`/assos/${asso.id}/daymail/${daymail.id}`)
    .expectAppError(ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS, asso.id, 'manage_asso'));

  it('should delete the daymail', async () => {
    await pactum
      .spec()
      .withBearerToken(userWithPermission.token)
      .delete(`/assos/${asso.id}/daymail/${daymail.id}`)
      .expectAssoDaymail(daymail);
    await createAssoDaymail(app, { asso }, daymail, true);
  });
});

export default DeleteDaymailE2ESpec;
