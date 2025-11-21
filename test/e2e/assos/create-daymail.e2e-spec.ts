import { Dummies, e2eSuite, JsonLike } from '../../utils/test_utils';
import {
  createAsso, createAssoDaymail,
  createAssoMembership,
  createAssoMembershipPermission,
  createAssoMembershipRole,
  createUser,
} from '../../utils/fakedb';
import * as pactum from 'pactum';
import { ERROR_CODE } from '../../../src/exceptions';
import AssosPostDaymailReqDto from '../../../src/assos/dto/req/assos-post-daymail-req.dto';
import { PrismaService } from '../../../src/prisma/prisma.service';

const CreateDaymailE2ESpec = e2eSuite('POST /assos/:assoId/daymail', (app) => {
  const asso = createAsso(app);
  const userWithPermission = createUser(app);
  const userWithoutPermission = createUser(app);
  const permissionManageAsso = createAssoMembershipPermission(app, { id: 'daymail' });
  const role = createAssoMembershipRole(app, { asso });
  createAssoMembership(app, { asso, user: userWithPermission, role, permissions: [permissionManageAsso] });
  const daymail = createAssoDaymail(app, { asso }, { date: new Date().add({ days: 7 }).getWeekDate() });

  const body: AssosPostDaymailReqDto = {
    title: { fr: "The title" },
    message: { fr: "The message" },
    date: new Date().add({ days: 14 }).getWeekDate(),
  }

  it('should return 403 as user is not authenticated', () =>
    pactum.spec().post(`/assos/${asso.id}/daymail`).expectAppError(ERROR_CODE.NOT_LOGGED_IN));

  it('should return a 400 as the assoId param is not valid', () =>
    pactum
      .spec()
      .withBearerToken(userWithPermission.token)
      .post('/assos/thisisnotavaliduuid/daymail')
      .withBody(body)
      .expectAppError(ERROR_CODE.PARAM_NOT_UUID, 'assoId'));

  it('should return a 404 as asso is not found', () =>
    pactum
      .spec()
      .withBearerToken(userWithPermission.token)
      .post(`/assos/${Dummies.UUID}/daymail`)
      .withBody(body)
      .expectAppError(ERROR_CODE.NO_SUCH_ASSO, Dummies.UUID));

  it('should return a 403 as user does not have the permission to create a daymail', () => pactum
    .spec()
    .withBearerToken(userWithoutPermission.token)
    .post(`/assos/${asso.id}/daymail`)
    .withBody(body)
    .expectAppError(ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS, asso.id, 'daymail'));

  it('should return a 400 as the title was not provided in any language', () =>
    pactum
      .spec()
      .withBearerToken(userWithPermission.token)
      .post(`/assos/${asso.id}/daymail`)
      .withBody({ ...body, title: {} })
      .expectAppError(ERROR_CODE.PARAM_MISSING_EITHER, 'fr, en, es, de, zh'));

  it('should return a 400 as the message was not provided in any language', () => pactum
    .spec()
    .withBearerToken(userWithPermission.token)
    .post(`/assos/${asso.id}/daymail`)
    .withBody({ ...body, message: {} })
    .expectAppError(ERROR_CODE.PARAM_MISSING_EITHER, 'fr, en, es, de, zh'));

  it('should return a 400 as the date is not a week-date', () => pactum
    .spec()
    .withBearerToken(userWithPermission.token)
    .post(`/assos/${asso.id}/daymail`)
    .withBody({ ...body, date: new Date(Date.UTC(2024, 10, 9)) })
    .expectAppError(ERROR_CODE.PARAM_DATE_MUST_BE_A_WEEK_DATE, 'date'));

  it('should fail as the daymail was already sent for the requested week', () => pactum
    .spec()
    .withBearerToken(userWithPermission.token)
    .post(`/assos/${asso.id}/daymail`)
    .withBody({ ...body, date: new Date(Date.UTC(2024, 10, 10)) })
    .expectAppError(ERROR_CODE.DAYMAIL_ALREADY_SENT_FOR_WEEK, new Date(Date.UTC(2024, 10, 10)).toISOString()));

  it('should fail as the asso already has a planned daymail for the requested week', () =>
    pactum
      .spec()
      .withBearerToken(userWithPermission.token)
      .post(`/assos/${asso.id}/daymail`)
      .withBody({ ...body, date: daymail.date })
      .expectAppError(ERROR_CODE.DAYMAIL_ALREADY_PLANNED_FOR_WEEK));

  it('should successfully create a new daymail', async () => {
    const id: string = await pactum
      .spec()
      .withBearerToken(userWithPermission.token)
      .post(`/assos/${asso.id}/daymail`)
      .withBody(body)
      .expectAssoDaymail(
        {
          id: JsonLike.UUID,
          assoId: asso.id,
          createdAt: JsonLike.DATE,
          title: body.title,
          message: body.message,
          date: body.date,
        },
        true,
      )
      .returns('id');
    return app().get(PrismaService).assoDaymail.delete({ where: { id } });
  });
});

export default CreateDaymailE2ESpec;
