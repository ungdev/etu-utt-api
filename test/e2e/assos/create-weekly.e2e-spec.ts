import { Dummies, e2eSuite, JsonLike } from '#/utils/test_utils';
import {
  createAsso, createAssoWeekly,
  createAssoMembership,
  createAssoMembershipPermission,
  createAssoMembershipRole,
  createUser,
} from '#/utils/fakedb';
import * as pactum from 'pactum';
import { ERROR_CODE } from '@/exceptions';
import AssosPostWeeklyReqDto from '@/assos/weekly/dto/req/weekly-req.dto';
import { PrismaService } from '@/prisma/prisma.service';

const CreateWeeklyE2ESpec = e2eSuite('POST /assos/:assoId/weekly', (app) => {
  const asso = createAsso(app);
  const userWithPermission = createUser(app);
  const userWithoutPermission = createUser(app);
  const permissionManageAsso = createAssoMembershipPermission(app, { id: 'weekly' });
  const role = createAssoMembershipRole(app, { asso });
  createAssoMembership(app, { asso, user: userWithPermission, role, permissions: [permissionManageAsso] });
  const weekly = createAssoWeekly(app, { asso }, { date: new Date().add({ days: 7 }).getWeekDate() });

  const body: AssosPostWeeklyReqDto = {
    title: { fr: "The title" },
    message: { fr: "The message" },
    date: new Date().add({ days: 14 }).getWeekDate(),
  }

  it('should return 401 as user is not authenticated', () =>
    pactum.spec().post(`/assos/${asso.id}/weekly`).expectAppError(ERROR_CODE.NOT_LOGGED_IN));

  it('should return a 400 as the assoId param is not valid', () =>
    pactum
      .spec()
      .withBearerToken(userWithPermission.token)
      .post('/assos/thisisnotavaliduuid/weekly')
      .withBody(body)
      .expectAppError(ERROR_CODE.PARAM_NOT_UUID, 'assoId'));

  it('should return a 404 as asso is not found', () =>
    pactum
      .spec()
      .withBearerToken(userWithPermission.token)
      .post(`/assos/${Dummies.UUID}/weekly`)
      .withBody(body)
      .expectAppError(ERROR_CODE.NO_SUCH_ASSO, Dummies.UUID));

  it('should return a 403 as user does not have the permission to create a weekly', () => pactum
    .spec()
    .withBearerToken(userWithoutPermission.token)
    .post(`/assos/${asso.id}/weekly`)
    .withBody(body)
    .expectAppError(ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS, asso.id, 'weekly'));

  it('should return a 400 as the title was not provided in any language', () =>
    pactum
      .spec()
      .withBearerToken(userWithPermission.token)
      .post(`/assos/${asso.id}/weekly`)
      .withBody({ ...body, title: {} })
      .expectAppError(ERROR_CODE.PARAM_MISSING_EITHER, 'fr, en, es, de, zh'));

  it('should return a 400 as the message was not provided in any language', () => pactum
    .spec()
    .withBearerToken(userWithPermission.token)
    .post(`/assos/${asso.id}/weekly`)
    .withBody({ ...body, message: {} })
    .expectAppError(ERROR_CODE.PARAM_MISSING_EITHER, 'fr, en, es, de, zh'));

  it('should return a 400 as the date is not a week-date', () => pactum
    .spec()
    .withBearerToken(userWithPermission.token)
    .post(`/assos/${asso.id}/weekly`)
    .withBody({ ...body, date: new Date(Date.UTC(2024, 10, 9)) })
    .expectAppError(ERROR_CODE.PARAM_DATE_MUST_BE_A_WEEK_DATE, 'date'));

  it('should fail as the weekly was already sent for the requested week', () => pactum
    .spec()
    .withBearerToken(userWithPermission.token)
    .post(`/assos/${asso.id}/weekly`)
    .withBody({ ...body, date: new Date(Date.UTC(2024, 10, 10)) })
    .expectAppError(ERROR_CODE.WEEKLY_ALREADY_SENT_FOR_WEEK, new Date(Date.UTC(2024, 10, 10)).toISOString()));

  it('should fail as the asso already has a planned weekly for the requested week', () =>
    pactum
      .spec()
      .withBearerToken(userWithPermission.token)
      .post(`/assos/${asso.id}/weekly`)
      .withBody({ ...body, date: weekly.date })
      .expectAppError(ERROR_CODE.WEEKLY_ALREADY_PLANNED_FOR_WEEK));

  it('should successfully create a new weekly', async () => {
    const id: string = await pactum
      .spec()
      .withBearerToken(userWithPermission.token)
      .post(`/assos/${asso.id}/weekly`)
      .withBody(body)
      .expectAssoWeekly(
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
    return app().get(PrismaService).assoWeekly.delete({ where: { id } });
  });
});

export default CreateWeeklyE2ESpec;
