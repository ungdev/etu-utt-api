import { Dummies, e2eSuite, JsonLike } from '../../utils/test_utils';
import { createAsso, createAssoMembership, createAssoMembershipRole, createUser } from '../../utils/fakedb';
import * as pactum from 'pactum';
import { ERROR_CODE } from '../../../src/exceptions';

const GetAssoMembersE2ESpec = e2eSuite('GET /assos/:id/members', (app) => {
  const user = createUser(app);
  const asso = createAsso(app);
  const assoMembershipRole = createAssoMembershipRole(app, { asso });
  createAssoMembership(app, { asso, role: assoMembershipRole, user });

  it('should return 403 as user is not authenticated', () =>
    pactum.spec().get(`/assos/${asso.id}/members`).expectAppError(ERROR_CODE.NOT_LOGGED_IN));

  it('should return a 400 as the id param is not valid', () =>
    pactum
      .spec()
      .withBearerToken(user.token)
      .get('/assos/thisisnotavaliduuid/members')
      .expectAppError(ERROR_CODE.PARAM_NOT_UUID, 'assoId'));

  it('should return a 404 as asso is not found', () =>
    pactum
      .spec()
      .withBearerToken(user.token)
      .get(`/assos/${Dummies.UUID}/members`)
      .expectAppError(ERROR_CODE.NO_SUCH_ASSO, Dummies.UUID));

  it('should successfully return the asso', () =>
    pactum
      .spec()
      .withBearerToken(user.token)
      .get(`/assos/${asso.id}/members`)
      .expectAssoMembershipRolesWithMembers(
        [
          assoMembershipRole,
          {
            id: JsonLike.ANY_UUID,
            isPresident: true,
            name: 'President',
            position: 0,
          },
        ],
        [[user], []],
      ));
});

export default GetAssoMembersE2ESpec;
