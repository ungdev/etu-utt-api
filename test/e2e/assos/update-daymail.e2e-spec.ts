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
import { faker } from '@faker-js/faker';
import { pick } from '../../../src/utils';

const UpdateDaymailE2ESpec = e2eSuite('PATCH /assos/:assoId/daymail/:daymailId', (app) => {
  const userWithPermission = createUser(app);
  const userWithoutPermission = createUser(app);
  const permissionManageAsso = createAssoMembershipPermission(app, { id: 'manage_asso' });

  const asso = createAsso(app);
  const role = createAssoMembershipRole(app, { asso });
  createAssoMembership(app, { asso, user: userWithPermission, role, permissions: [permissionManageAsso] });
  const initialSendDate = new Date().dropTime().add({ days: 2 });
  const daymail = createAssoDaymail(app, { asso }, { sendDates: [initialSendDate] });

  const otherAsso = createAsso(app);
  const otherAssoRole = createAssoMembershipRole(app, { asso });
  createAssoMembership(app, { asso: otherAsso, user: userWithPermission, role: otherAssoRole, permissions: [permissionManageAsso] });

  const generateBody = () => ({
    title: pick(faker.db.translation(), 'fr', 'en', 'zh'),
    message: pick(faker.db.translation(), 'de', 'es'),
    dates: [daymail.sendDates[0].add({ days: 1 })]
  })

  it('should return 403 as user is not authenticated', () =>
    pactum.spec().patch(`/assos/${asso.id}/daymail/${daymail.id}`).withJson(generateBody()).expectAppError(ERROR_CODE.NOT_LOGGED_IN));

  it('should return a 404 as asso is not found', () =>
    pactum
      .spec()
      .withBearerToken(userWithPermission.token)
      .patch(`/assos/${Dummies.UUID}/daymail/${daymail.id}`)
      .withJson(generateBody())
      .expectAppError(ERROR_CODE.NO_SUCH_ASSO, Dummies.UUID));

  it('should return a 404 as daymail is not found', () => pactum
    .spec()
    .withBearerToken(userWithPermission.token)
    .patch(`/assos/${asso.id}/daymail/${Dummies.UUID}`)
    .withJson(generateBody())
    .expectAppError(ERROR_CODE.NO_SUCH_DAYMAIL, Dummies.UUID))

  it('should return a 404 as the daymail does not belong to the asso', () => pactum
    .spec()
    .withBearerToken(userWithPermission.token)
    .patch(`/assos/${otherAsso.id}/daymail/${daymail.id}`)
    .withJson(generateBody())
    .expectAppError(ERROR_CODE.NO_SUCH_DAYMAIL, daymail.id));

  it('should return a 403 as user does not have the permission to update the daymails', () => pactum
    .spec()
    .withBearerToken(userWithoutPermission.token)
    .patch(`/assos/${asso.id}/daymail/${daymail.id}`)
    .withJson(generateBody())
    .expectAppError(ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS, asso.id, 'manage_asso'));

  it('should update the daymail', async () => {
    const body = generateBody();
    await pactum
      .spec()
      .withBearerToken(userWithPermission.token)
      .patch(`/assos/${asso.id}/daymail/${daymail.id}`)
      .withJson(body)
      .expectAssoDaymail({
        ...daymail,
        title: {...daymail.title, ...body.title},
        message: {...daymail.message, ...body.message},
        sendDates: body.dates,
      });
    daymail.title = {...daymail.title, ...body.title};
    daymail.message = {...daymail.message, ...body.message};
    daymail.sendDates = body.dates;
  });
});

export default UpdateDaymailE2ESpec;
