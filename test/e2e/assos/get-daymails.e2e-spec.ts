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

const SearchDaymailsE2ESpec = e2eSuite('GET /assos/:assoId/daymail', (app) => {
  const userWithPermission = createUser(app);
  const userWithoutPermission = createUser(app);
  const permissionManageAsso = createAssoMembershipPermission(app, { id: 'daymail' });

  const asso = createAsso(app);
  const roleAsso = createAssoMembershipRole(app, { asso });
  createAssoMembership(app, { asso, user: userWithPermission, role: roleAsso, permissions: [permissionManageAsso] });
  // Working request will be between the 1st, October and the 10th of October
  const daymailAssoOctober1 = createAssoDaymail(app, { asso }, { date: new Date(Date.UTC(2025, 9, 1)) });
  const daymailAssoOctober2 = createAssoDaymail(app, { asso }, { date: new Date(Date.UTC(2025, 9, 2)) });
  createAssoDaymail(app, { asso }, { date: new Date(Date.UTC(2025, 8, 1)) }); // September
  createAssoDaymail(app, { asso }, { date: new Date(Date.UTC(2025, 10, 1)) }); // November

  // Create a daymail for another asso, that we should not get
  const otherAsso = createAsso(app);
  const roleOtherAsso = createAssoMembershipRole(app, { asso: otherAsso });
  createAssoMembership(app, { asso: otherAsso, user: userWithPermission, role: roleOtherAsso, permissions: [permissionManageAsso] });
  createAssoDaymail(app, { asso: otherAsso }, { date: new Date(Date.UTC(2025, 9, 6)) });

  it('should return 403 as user is not authenticated', () =>
    pactum.spec().get(`/assos/${asso.id}/daymail/`).withQueryParams({ from: '2025-10-01T00:00:00Z', to: '2025-10-10T00:00:00Z' }).expectAppError(ERROR_CODE.NOT_LOGGED_IN));

  it('should return a 400 as the assoId param is not valid', () =>
    pactum
      .spec()
      .withBearerToken(userWithPermission.token)
      .get('/assos/thisisnotavaliduuid/daymail')
      .withQueryParams({ from: '2025-10-01T00:00:00Z', to: '2025-10-10T00:00:00Z' })
      .expectAppError(ERROR_CODE.PARAM_NOT_UUID, 'assoId'));

  it('should return a 404 as asso is not found', () =>
    pactum
      .spec()
      .withBearerToken(userWithPermission.token)
      .get(`/assos/${Dummies.UUID}/daymail`)
      .withQueryParams({ from: '2025-10-01T00:00:00Z', to: '2025-10-10T00:00:00Z' })
      .expectAppError(ERROR_CODE.NO_SUCH_ASSO, Dummies.UUID));

  it('should return a 400 as the `to` parameter comes before the `from` parameter', () =>
    pactum
      .spec()
      .withBearerToken(userWithPermission.token)
      .get(`/assos/${asso.id}/daymail`)
      .withQueryParams({ from: '2025-10-10T00:00:00Z', to: '2025-10-01T00:00:00Z' })
      .expectAppError(ERROR_CODE.PARAM_DATE_MUST_BE_AFTER, '2025-10-01T00:00:00.000Z', '2025-10-10T00:00:00.000Z'));

  it('should return a 403 as user does not have the permission to see the daymails', () => pactum
    .spec()
    .withBearerToken(userWithoutPermission.token)
    .get(`/assos/${asso.id}/daymail`)
    .withQueryParams({ from: '2025-10-01T00:00:00Z', to: '2025-10-10T00:00:00Z' })
    .expectAppError(ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS, asso.id, 'daymail'));

  it('should return daymails for `asso` between October, 1st and October, 31st', () => pactum
      .spec()
      .withBearerToken(userWithPermission.token)
      .get(`/assos/${asso.id}/daymail`)
      .withQueryParams({ from: '2025-10-01T00:00:00Z', to: '2025-10-31T00:00:00Z' })
      .expectAssoDaymails(app, [daymailAssoOctober1, daymailAssoOctober2], 2));
});

export default SearchDaymailsE2ESpec;
