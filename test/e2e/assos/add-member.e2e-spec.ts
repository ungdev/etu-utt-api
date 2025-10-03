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

const AddAssoMemberE2ESpec = e2eSuite('POST /assos/:id/members', (app) => {
  const user = createUser(app);
  const userAllowed = createUser(app);
  const user2 = createUser(app);
  const user3 = createUser(app);
  const asso = createAsso(app);
  const assoMembershipRole = createAssoMembershipRole(app, { asso });
  const permission = createAssoMembershipPermission(app, { id: 'manage_members' });
  const otherPermission = createAssoMembershipPermission(app, { id: 'other_permission' });
  createAssoMembership(app, { asso, role: assoMembershipRole, user });
  createAssoMembership(app, { asso, role: assoMembershipRole, user: userAllowed, permissions: [permission] });

  it('should return 403 as user is not authenticated', () =>
    pactum.spec().post(`/assos/${asso.id}/members`).expectAppError(ERROR_CODE.NOT_LOGGED_IN));

  it('should return a 400 as the id param is not valid', () =>
    pactum
      .spec()
      .withBearerToken(user.token)
      .post('/assos/thisisnotavaliduuid/members')
      .withBody({
        userId: user2.id,
        roleId: assoMembershipRole.id,
        permissions: [],
      })
      .expectAppError(ERROR_CODE.PARAM_NOT_UUID, 'assoId'));

  it('should return a 400 as expiration date is in the past', () =>
    pactum
      .spec()
      .withBearerToken(user.token)
      .post(`/assos/${asso.id}/members`)
      .withBody({
        userId: user2.id,
        roleId: assoMembershipRole.id,
        endAt: new Date(),
        permissions: [],
      })
      .expectAppError(ERROR_CODE.PARAM_PAST_DATE, 'endAt'));

  it('should return a 404 as asso is not found', () =>
    pactum
      .spec()
      .withBearerToken(user.token)
      .post(`/assos/${Dummies.UUID}/members`)
      .withBody({
        userId: user2.id,
        roleId: assoMembershipRole.id,
        permissions: [],
      })
      .expectAppError(ERROR_CODE.NO_SUCH_ASSO, Dummies.UUID));

  it('should return a 404 as role does not exist', () =>
    pactum
      .spec()
      .withBearerToken(userAllowed.token)
      .post(`/assos/${asso.id}/members`)
      .withBody({
        userId: user2.id,
        roleId: Dummies.UUID,
        permissions: [],
      })
      .expectAppError(ERROR_CODE.NO_SUCH_ASSO_ROLE, asso.id));

  it('should return a 404 as user does not exist', () =>
    pactum
      .spec()
      .withBearerToken(userAllowed.token)
      .post(`/assos/${asso.id}/members`)
      .withBody({
        userId: Dummies.UUID,
        roleId: assoMembershipRole.id,
        permissions: [],
      })
      .expectAppError(ERROR_CODE.NO_SUCH_USER, Dummies.UUID));

  it('should return a 403 as user has no permission', () =>
    pactum
      .spec()
      .withBearerToken(user.token)
      .post(`/assos/${asso.id}/members`)
      .withBody({
        userId: user2.id,
        roleId: assoMembershipRole.id,
        permissions: [],
      })
      .expectAppError(ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS, asso.id, permission.id));

  it('should return a 403 as user grants a permission he does not have', () =>
    pactum
      .spec()
      .withBearerToken(userAllowed.token)
      .post(`/assos/${asso.id}/members`)
      .withBody({
        userId: user2.id,
        roleId: assoMembershipRole.id,
        permissions: [permission.id, otherPermission.id],
      })
      .expectAppError(ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS, asso.id, [permission.id, otherPermission.id].join(', ')));

  it('should fail as user is already in the AssoRole', () =>
    pactum
      .spec()
      .withBearerToken(userAllowed.token)
      .post(`/assos/${asso.id}/members`)
      .withBody({
        userId: user.id,
        roleId: assoMembershipRole.id,
        permissions: [permission.id],
      })
      .expectAppError(ERROR_CODE.USER_ALREADY_ASSO_ROLE_MEMBER, assoMembershipRole.name));

  it('should add the user to the AssoRole', () =>
    pactum
      .spec()
      .withBearerToken(userAllowed.token)
      .post(`/assos/${asso.id}/members`)
      .withBody({
        userId: user2.id,
        roleId: assoMembershipRole.id,
        permissions: [permission.id],
      })
      .expectAssoMembershipCreated({
        id: JsonLike.ANY_UUID,
        assoId: asso.id,
        userId: user2.id,
        roleId: assoMembershipRole.id,
        startAt: JsonLike.ANY_DATE,
        endAt: JsonLike.ANY_DATE,
      }));

  it('should add the user to the AssoRole with asso account', async () => {
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
      .post(`/assos/${asso.id}/members`)
      .withBody({
        userId: user3.id,
        roleId: assoMembershipRole.id,
        permissions: [permission.id, otherPermission.id],
      })
      .expectAssoMembershipCreated({
        id: JsonLike.ANY_UUID,
        assoId: asso.id,
        userId: user3.id,
        roleId: assoMembershipRole.id,
        startAt: JsonLike.ANY_DATE,
        endAt: JsonLike.ANY_DATE,
      });
  });
});

export default AddAssoMemberE2ESpec;
