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
import { PrismaService } from '../../../src/prisma/prisma.service';
import { faker } from '@faker-js/faker';
import { DEFAULT_APPLICATION } from '../../../prisma/seed/utils';
import { AuthService } from '../../../src/auth/auth.service';

const KickAssoMemberE2ESpec = e2eSuite('DELETE /assos/:id/members/:id', (app) => {
  const userNotAllowed = createUser(app);
  const userAllowed = createUser(app);
  const userInAsso = createUser(app);
  const otherUserInAsso = createUser(app);
  const asso = createAsso(app);
  const asso2 = createAsso(app);
  const assoMembershipRole = createAssoMembershipRole(app, { asso });
  const permission = createAssoMembershipPermission(app, { id: 'manage_members' });
  const userInAssoMembershipInAsso = createAssoMembership(app, { asso, role: assoMembershipRole, user: userInAsso });
  const userInAssoMembershipInAsso2 = createAssoMembership(app, {
    asso: asso2,
    role: assoMembershipRole,
    user: userInAsso,
  });
  const otherUserInAssoMembershipInAsso = createAssoMembership(app, {
    asso,
    role: assoMembershipRole,
    user: otherUserInAsso,
  });
  createAssoMembership(app, { asso, role: assoMembershipRole, user: userAllowed, permissions: [permission] });

  it('should return 403 as user is not authenticated', () =>
    pactum
      .spec()
      .delete(`/assos/${asso.id}/members/${userInAssoMembershipInAsso.id}`)
      .expectAppError(ERROR_CODE.NOT_LOGGED_IN));

  it('should return a 400 as the asso id param is not valid', () =>
    pactum
      .spec()
      .withBearerToken(userNotAllowed.token)
      .delete(`/assos/thisisnotavaliduuid/members/${userInAssoMembershipInAsso.id}`)
      .expectAppError(ERROR_CODE.PARAM_NOT_UUID, 'assoId'));

  it('should return a 400 as the member id param is not valid', () =>
    pactum
      .spec()
      .withBearerToken(userNotAllowed.token)
      .delete(`/assos/${asso.id}/members/thisisnotavaliduuid`)
      .expectAppError(ERROR_CODE.PARAM_NOT_UUID, 'memberId'));

  it('should return a 404 as asso is not found', () =>
    pactum
      .spec()
      .withBearerToken(userNotAllowed.token)
      .delete(`/assos/${Dummies.UUID}/members/${userInAssoMembershipInAsso.id}`)
      .expectAppError(ERROR_CODE.NO_SUCH_ASSO, Dummies.UUID));

  it('should return a 404 as member is not found', () =>
    pactum
      .spec()
      .withBearerToken(userNotAllowed.token)
      .delete(`/assos/${asso.id}/members/${Dummies.UUID}`)
      .expectAppError(ERROR_CODE.NO_SUCH_ASSO_MEMBERSHIP, Dummies.UUID));

  it('should return a 403 as user has no permission', () =>
    pactum
      .spec()
      .withBearerToken(userNotAllowed.token)
      .delete(`/assos/${asso.id}/members/${userInAssoMembershipInAsso.id}`)
      .expectAppError(ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS, asso.id, permission.id));

  it('should fail as membership is not part of this Asso', () =>
    pactum
      .spec()
      .withBearerToken(userAllowed.token)
      .delete(`/assos/${asso.id}/members/${userInAssoMembershipInAsso2.id}`)
      .expectAppError(ERROR_CODE.NO_SUCH_ASSO_MEMBERSHIP, userInAssoMembershipInAsso2.id));

  it('should kick the user from the AssoRole', () =>
    pactum
      .spec()
      .withBearerToken(userAllowed.token)
      .delete(`/assos/${asso.id}/members/${userInAssoMembershipInAsso.id}`)
      .expectAssoMembership({
        id: userInAssoMembershipInAsso.id,
        assoId: asso.id,
        userId: userInAsso.id,
        roleId: assoMembershipRole.id,
        startAt: userInAssoMembershipInAsso.startAt.toISOString(),
        endAt: JsonLike.ANY_DATE,
      }));

  it('should kick the user from the AssoRole with asso account', async () => {
    const assoUser = await app()
      .get(PrismaService)
      .user.findUnique({ where: { login: asso.name } });
    const apiKey = await app()
      .get(PrismaService)
      .apiKey.create({
        data: {
          token: faker.string.alphanumeric(30),
          user: { connect: { id: assoUser.id } },
          application: { connect: { id: DEFAULT_APPLICATION.id } },
        },
      });
    const token = await app().get(AuthService).signAuthenticationToken(apiKey.token);
    return pactum
      .spec()
      .withBearerToken(token)
      .delete(`/assos/${asso.id}/members/${otherUserInAssoMembershipInAsso.id}`)
      .expectAssoMembership({
        id: otherUserInAssoMembershipInAsso.id,
        assoId: asso.id,
        userId: otherUserInAsso.id,
        roleId: assoMembershipRole.id,
        startAt: otherUserInAssoMembershipInAsso.startAt.toISOString(),
        endAt: JsonLike.ANY_DATE,
      });
  });
});

export default KickAssoMemberE2ESpec;
