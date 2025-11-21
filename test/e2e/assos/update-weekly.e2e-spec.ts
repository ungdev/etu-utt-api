import { Dummies, e2eSuite } from '../../utils/test_utils';
import {
  createAsso, createAssoWeekly,
  createAssoMembership,
  createAssoMembershipPermission,
  createAssoMembershipRole,
  createUser,
} from '../../utils/fakedb';
import * as pactum from 'pactum';
import { ERROR_CODE } from '../../../src/exceptions';
import { faker } from '@faker-js/faker';
import { pick } from '../../../src/utils';

const UpdateWeeklyE2ESpec = e2eSuite('PATCH /assos/:assoId/weekly/:weeklyId', (app) => {
  const userWithPermission = createUser(app);
  const userWithoutPermission = createUser(app);
  const permissionWeekly = createAssoMembershipPermission(app, { id: 'weekly' });

  const asso = createAsso(app);
  const role = createAssoMembershipRole(app, { asso });
  createAssoMembership(app, { asso, user: userWithPermission, role, permissions: [permissionWeekly] });
  const weekly = createAssoWeekly(app, { asso }, { date: new Date().add({ days: 14 }).getWeekDate() });
  const oldWeekly = createAssoWeekly(app, { asso }, { date: new Date(Date.UTC(2024, 10, 10)) });

  const otherAsso = createAsso(app);
  const otherAssoRole = createAssoMembershipRole(app, { asso: otherAsso });
  createAssoMembership(app, { asso: otherAsso, user: userWithPermission, role: otherAssoRole, permissions: [permissionWeekly] });

  const generateBody = () => ({
    title: pick(faker.db.translation(), 'fr', 'en', 'zh'),
    message: pick(faker.db.translation(), 'de', 'es'),
    date: weekly.date.add({ days: 7 }),
  });

  it('should return 403 as user is not authenticated', () =>
    pactum.spec().patch(`/assos/${asso.id}/weekly/${weekly.id}`).withJson(generateBody()).expectAppError(ERROR_CODE.NOT_LOGGED_IN));

  it('should return a 404 as asso is not found', () =>
    pactum
      .spec()
      .withBearerToken(userWithPermission.token)
      .patch(`/assos/${Dummies.UUID}/weekly/${weekly.id}`)
      .withJson(generateBody())
      .expectAppError(ERROR_CODE.NO_SUCH_ASSO, Dummies.UUID));

  it('should return a 403 as user does not have the permission to update the weeklies', () => pactum
    .spec()
    .withBearerToken(userWithoutPermission.token)
    .patch(`/assos/${asso.id}/weekly/${weekly.id}`)
    .withJson(generateBody())
    .expectAppError(ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS, asso.id, 'weekly'));

  it('should return a 404 as weekly is not found', () => pactum
    .spec()
    .withBearerToken(userWithPermission.token)
    .patch(`/assos/${asso.id}/weekly/${Dummies.UUID}`)
    .withJson(generateBody())
    .expectAppError(ERROR_CODE.NO_SUCH_WEEKLY, Dummies.UUID))

  it('should return a 404 as the weekly does not belong to the asso', () => pactum
    .spec()
    .withBearerToken(userWithPermission.token)
    .patch(`/assos/${otherAsso.id}/weekly/${weekly.id}`)
    .withJson(generateBody())
    .expectAppError(ERROR_CODE.NO_SUCH_WEEKLY, weekly.id));

  it('should return a 400 as the weekly was already sent', () => pactum
    .spec()
    .withBearerToken(userWithPermission.token)
    .patch(`/assos/${asso.id}/weekly/${oldWeekly.id}`)
    .withJson(generateBody())
    .expectAppError(ERROR_CODE.WEEKLY_ALREADY_SENT));

  it('should return a 400 as the weeklies planned at the new date were already sent', () => pactum
    .spec()
    .withBearerToken(userWithPermission.token)
    .patch(`/assos/${asso.id}/weekly/${weekly.id}`)
    .withJson({ ...generateBody(), date: new Date(Date.UTC(2024, 10, 10)) })
    .expectAppError(ERROR_CODE.WEEKLY_ALREADY_SENT_FOR_WEEK, new Date(Date.UTC(2024, 10, 10)).toISOString()));

  it('should update the weekly', async () => {
    const body = generateBody();
    await pactum
      .spec()
      .withBearerToken(userWithPermission.token)
      .patch(`/assos/${asso.id}/weekly/${weekly.id}`)
      .withJson(body)
      .expectAssoWeekly({
        ...weekly,
        title: {...weekly.title, ...body.title},
        message: {...weekly.message, ...body.message},
        date: body.date,
      });
    weekly.title = {...weekly.title, ...body.title};
    weekly.message = {...weekly.message, ...body.message};
    weekly.date = body.date;
  });
});

export default UpdateWeeklyE2ESpec;
