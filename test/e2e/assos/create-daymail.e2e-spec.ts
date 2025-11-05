import { Dummies, e2eSuite, JsonLike } from '../../utils/test_utils';
import {
  createAsso,
  createAssoMembership,
  createAssoMembershipPermission,
  createAssoMembershipRole,
  createUser,
} from '../../utils/fakedb';
import * as pactum from 'pactum';
import { ERROR_CODE } from '../../../src/exceptions';
import AssosPostDaymailReqDto from '../../../src/assos/dto/req/assos-post-daymail-req.dto';

const CreateDaymailE2ESpec = e2eSuite('POST /assos/:assoId/daymail', (app) => {
  const asso = createAsso(app);
  const userWithPermission = createUser(app);
  const userWithoutPermission = createUser(app);
  const permissionManageAsso = createAssoMembershipPermission(app, {id: 'manage_asso'});
  const role = createAssoMembershipRole(app, {asso});
  createAssoMembership(app, {asso, user: userWithPermission, role, permissions: [permissionManageAsso]});

  const body: AssosPostDaymailReqDto = {title: {fr: "The title"}, message: {fr: "The message"}, dates: [new Date(Date.now() + 1e6), new Date(Date.now() + 2e6)]}

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
    .expectAppError(ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS, asso.id, 'manage_asso'));

  it('should return a 400 as the title was not provided in any language', () =>
    pactum
      .spec()
      .withBearerToken(userWithPermission.token)
      .post(`/assos/${asso.id}/daymail`)
      .withBody({ ...body, title: {} })
      .expectAppError(ERROR_CODE.PARAM_MISSING_EITHER, 'fr, en, es, de, zh'));

  it('should return a 400 as the body was not provided in any language', () => pactum
    .spec()
    .withBearerToken(userWithPermission.token)
    .post(`/assos/${asso.id}/daymail`)
    .withBody({ ...body, message: {} })
    .expectAppError(ERROR_CODE.PARAM_MISSING_EITHER, 'fr, en, es, de, zh'));

  it('should successfully create a new daymail', () =>
    pactum
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
          sendDates: body.dates,
        },
        true,
      ));
});

export default CreateDaymailE2ESpec;
