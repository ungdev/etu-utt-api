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
  const permissionDaymail = createAssoMembershipPermission(app, { id: 'daymail' });

  const asso = createAsso(app);
  const role = createAssoMembershipRole(app, { asso });
  createAssoMembership(app, { asso, user: userWithPermission, role, permissions: [permissionDaymail] });
  const daymail = createAssoDaymail(app, { asso }, { date: new Date().add({ days: 14 }).getWeekDate() });
  const oldDaymail = createAssoDaymail(app, { asso }, { date: new Date(Date.UTC(2024, 10, 10)) });

  const otherAsso = createAsso(app);
  const otherAssoRole = createAssoMembershipRole(app, { asso: otherAsso });
  createAssoMembership(app, { asso: otherAsso, user: userWithPermission, role: otherAssoRole, permissions: [permissionDaymail] });

  const generateBody = () => ({
    title: pick(faker.db.translation(), 'fr', 'en', 'zh'),
    message: pick(faker.db.translation(), 'de', 'es'),
    date: daymail.date.add({ days: 7 }),
  });

  it('should return 403 as user is not authenticated', () =>
    pactum.spec().patch(`/assos/${asso.id}/daymail/${daymail.id}`).withJson(generateBody()).expectAppError(ERROR_CODE.NOT_LOGGED_IN));

  it('should return a 404 as asso is not found', () =>
    pactum
      .spec()
      .withBearerToken(userWithPermission.token)
      .patch(`/assos/${Dummies.UUID}/daymail/${daymail.id}`)
      .withJson(generateBody())
      .expectAppError(ERROR_CODE.NO_SUCH_ASSO, Dummies.UUID));

  it('should return a 403 as user does not have the permission to update the daymails', () => pactum
    .spec()
    .withBearerToken(userWithoutPermission.token)
    .patch(`/assos/${asso.id}/daymail/${daymail.id}`)
    .withJson(generateBody())
    .expectAppError(ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS, asso.id, 'daymail'));

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

  it('should return a 400 as the daymail was already sent', () => pactum
    .spec()
    .withBearerToken(userWithPermission.token)
    .patch(`/assos/${asso.id}/daymail/${oldDaymail.id}`)
    .withJson(generateBody())
    .expectAppError(ERROR_CODE.DAYMAIL_ALREADY_SENT));

  it('should return a 400 as the daymails planned at the new date were already sent', () => pactum
    .spec()
    .withBearerToken(userWithPermission.token)
    .patch(`/assos/${asso.id}/daymail/${daymail.id}`)
    .withJson({ ...generateBody(), date: new Date(Date.UTC(2024, 10, 10)) })
    .expectAppError(ERROR_CODE.DAYMAIL_ALREADY_SENT_FOR_WEEK, new Date(Date.UTC(2024, 10, 10)).toISOString()));

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
        date: body.date,
      });
    daymail.title = {...daymail.title, ...body.title};
    daymail.message = {...daymail.message, ...body.message};
    daymail.date = body.date;
  });
});

export default UpdateDaymailE2ESpec;
