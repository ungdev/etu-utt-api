import { Dummies, e2eSuite } from '#/utils/test_utils';
import {
  createAsso, createAssoMembership,
  createAssoMembershipPermission,
  createAssoMembershipRole,
  createAssoWeekly,
  createUser,
} from '#/utils/fakedb';
import * as pactum from 'pactum';
import { ERROR_CODE } from '@/exceptions';

const DeleteWeeklyE2ESpec = e2eSuite('DELETE /assos/:assoId/weekly/:weeklyId', (app) => {
  const userWithPermission = createUser(app);
  const userWithoutPermission = createUser(app);
  const permissionManageAsso = createAssoMembershipPermission(app, { id: 'weekly' });

  const asso = createAsso(app);
  const role = createAssoMembershipRole(app, { asso });
  createAssoMembership(app, { asso, user: userWithPermission, role, permissions: [permissionManageAsso] });
  const weekly = createAssoWeekly(app, { asso }, { date: new Date().add({ days: 14 }).getWeekDate() });
  const oldWeekly = createAssoWeekly(app, { asso }, { date: new Date(Date.UTC(2025, 10, 10)) });

  const otherAsso = createAsso(app);
  const otherAssoRole = createAssoMembershipRole(app, { asso });
  createAssoMembership(app, { asso: otherAsso, user: userWithPermission, role: otherAssoRole, permissions: [permissionManageAsso] });

  it('should return 401 as user is not authenticated', () =>
    pactum.spec().delete(`/assos/${asso.id}/weekly/${weekly.id}`).expectAppError(ERROR_CODE.NOT_LOGGED_IN));

  it('should return a 404 as asso is not found', () =>
    pactum
      .spec()
      .withBearerToken(userWithPermission.token)
      .delete(`/assos/${Dummies.UUID}/weekly/${weekly.id}`)
      .expectAppError(ERROR_CODE.NO_SUCH_ASSO, Dummies.UUID));

  it('should return a 403 as user does not have the permission to update the weeklies', () => pactum
    .spec()
    .withBearerToken(userWithoutPermission.token)
    .delete(`/assos/${asso.id}/weekly/${weekly.id}`)
    .expectAppError(ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS, asso.id, 'weekly'));

  it('should return a 404 as weekly is not found', () => pactum
    .spec()
    .withBearerToken(userWithPermission.token)
    .delete(`/assos/${asso.id}/weekly/${Dummies.UUID}`)
    .expectAppError(ERROR_CODE.NO_SUCH_WEEKLY, Dummies.UUID))

  it('should return a 404 as the weekly does not belong to the asso', () => pactum
    .spec()
    .withBearerToken(userWithPermission.token)
    .delete(`/assos/${otherAsso.id}/weekly/${weekly.id}`)
    .expectAppError(ERROR_CODE.NO_SUCH_WEEKLY, weekly.id));

  it('should return a 400 as the weekly was already sent', () => pactum
    .spec()
    .withBearerToken(userWithPermission.token)
    .delete(`/assos/${asso.id}/weekly/${oldWeekly.id}`)
    .expectAppError(ERROR_CODE.WEEKLY_ALREADY_SENT));

  it('should delete the weekly', async () => {
    await pactum
      .spec()
      .withBearerToken(userWithPermission.token)
      .delete(`/assos/${asso.id}/weekly/${weekly.id}`)
      .expectAssoWeekly(weekly);
    await createAssoWeekly(app, { asso }, weekly, true);
  });
});

export default DeleteWeeklyE2ESpec;
