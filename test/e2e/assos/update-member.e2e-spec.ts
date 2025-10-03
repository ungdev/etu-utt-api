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

const UpdateAssoMemberE2ESpec = e2eSuite('PATCH /assos/:id/members/:id', (app) => {
  const user = createUser(app);
  const userAllowed = createUser(app);
  const userInAsso = createUser(app);
  const otherUserInAsso = createUser(app);
  const asso = createAsso(app);
  const asso2 = createAsso(app);
  const assoMembershipRole = createAssoMembershipRole(app, { asso });
  const assoMembershipRole2 = createAssoMembershipRole(app, { asso });
  const permission = createAssoMembershipPermission(app, { id: 'manage_members' });
  const otherPermission = createAssoMembershipPermission(app, { id: 'destroy_etuutt' });
  const mb = createAssoMembership(app, { asso, role: assoMembershipRole, user: userInAsso });
  createAssoMembership(app, { asso, role: assoMembershipRole2, user: userInAsso });
  const mbAsso2 = createAssoMembership(app, { asso: asso2, role: assoMembershipRole, user: userInAsso });
  const mbOtherUser = createAssoMembership(app, { asso, role: assoMembershipRole, user: otherUserInAsso });
  createAssoMembership(app, { asso, role: assoMembershipRole, user: userAllowed, permissions: [permission] });

  const endAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);

  it('should return 403 as user is not authenticated', () =>
    pactum
      .spec()
      .patch(`/assos/${asso.id}/members/${mb.id}`)
      .withBody({
        roleId: assoMembershipRole.id,
        permissions: [permission.id],
        endAt,
      })
      .expectAppError(ERROR_CODE.NOT_LOGGED_IN));

  it('should return a 400 as the asso id param is not valid', () =>
    pactum
      .spec()
      .withBearerToken(user.token)
      .patch(`/assos/thisisnotavaliduuid/members/${mb.id}`)
      .withBody({
        roleId: assoMembershipRole.id,
        permissions: [permission.id],
        endAt,
      })
      .expectAppError(ERROR_CODE.PARAM_NOT_UUID, 'assoId'));

  it('should return a 400 as the member id param is not valid', () =>
    pactum
      .spec()
      .withBearerToken(user.token)
      .patch(`/assos/${asso.id}/members/thisisnotavaliduuid`)
      .withBody({
        roleId: assoMembershipRole.id,
        permissions: [permission.id],
        endAt,
      })
      .expectAppError(ERROR_CODE.PARAM_NOT_UUID, 'memberId'));

  it('should return a 400 as expiration date is in the past', () =>
    pactum
      .spec()
      .withBearerToken(userAllowed.token)
      .patch(`/assos/${asso.id}/members/${mb.id}`)
      .withBody({
        permissions: [permission.id],
        endAt: new Date(),
      })
      .expectAppError(ERROR_CODE.PARAM_PAST_DATE, 'endAt'));

  it('should return a 404 as asso is not found', () =>
    pactum
      .spec()
      .withBearerToken(user.token)
      .patch(`/assos/${Dummies.UUID}/members/${mb.id}`)
      .withBody({
        roleId: assoMembershipRole.id,
        permissions: [permission.id],
        endAt,
      })
      .expectAppError(ERROR_CODE.NO_SUCH_ASSO, Dummies.UUID));

  it('should return a 404 as member is not found', () =>
    pactum
      .spec()
      .withBearerToken(user.token)
      .patch(`/assos/${asso.id}/members/${Dummies.UUID}`)
      .withBody({
        roleId: assoMembershipRole.id,
        permissions: [permission.id],
        endAt,
      })
      .expectAppError(ERROR_CODE.NO_SUCH_ASSO_MEMBERSHIP, Dummies.UUID));

  it('should return a 403 as user has no permission', () =>
    pactum
      .spec()
      .withBearerToken(user.token)
      .patch(`/assos/${asso.id}/members/${mb.id}`)
      .withBody({
        roleId: assoMembershipRole.id,
        permissions: [permission.id],
        endAt,
      })
      .expectAppError(ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS, asso.id, permission.id));

  it('should fail as membership is not part of this Asso', () =>
    pactum
      .spec()
      .withBearerToken(userAllowed.token)
      .patch(`/assos/${asso.id}/members/${mbAsso2.id}`)
      .withBody({
        roleId: assoMembershipRole.id,
        permissions: [permission.id],
        endAt,
      })
      .expectAppError(ERROR_CODE.NO_SUCH_ASSO_MEMBERSHIP, mbAsso2.id));

  it('should return a 404 as role does not exist', () =>
    pactum
      .spec()
      .withBearerToken(userAllowed.token)
      .patch(`/assos/${asso.id}/members/${mb.id}`)
      .withBody({
        roleId: Dummies.UUID,
        permissions: [permission.id],
        endAt,
      })
      .expectAppError(ERROR_CODE.NO_SUCH_ASSO_ROLE, asso.id));

  it('should return a 403 as user grants a permission he does not have', () =>
    pactum
      .spec()
      .withBearerToken(userAllowed.token)
      .patch(`/assos/${asso.id}/members/${mb.id}`)
      .withBody({
        permissions: [permission.id, otherPermission.id],
        endAt,
      })
      .expectAppError(ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS, asso.id, [permission.id, otherPermission.id].join(', ')));

  it('should fail as user is already in the AssoRole', () =>
    pactum
      .spec()
      .withBearerToken(userAllowed.token)
      .patch(`/assos/${asso.id}/members/${mb.id}`)
      .withBody({
        roleId: assoMembershipRole2.id,
        permissions: [],
        endAt,
      })
      .expectAppError(ERROR_CODE.USER_ALREADY_ASSO_ROLE_MEMBER, assoMembershipRole2.name));

  it('should update the membership', () =>
    pactum
      .spec()
      .withBearerToken(userAllowed.token)
      .patch(`/assos/${asso.id}/members/${mb.id}`)
      .withBody({
        permissions: [permission.id],
        endAt,
      })
      .expectAssoMembership({
        id: JsonLike.ANY_UUID,
        assoId: asso.id,
        userId: userInAsso.id,
        roleId: assoMembershipRole.id,
        startAt: JsonLike.ANY_DATE,
        endAt: JsonLike.ANY_DATE,
      }));

  it('should update the membership with asso account', async () => {
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
      .patch(`/assos/${asso.id}/members/${mbOtherUser.id}`)
      .withBody({
        permissions: [permission.id],
        endAt,
      })
      .expectAssoMembership({
        id: JsonLike.ANY_UUID,
        assoId: asso.id,
        userId: otherUserInAsso.id,
        roleId: assoMembershipRole.id,
        startAt: JsonLike.ANY_DATE,
        endAt: JsonLike.ANY_DATE,
      });
  });
});

export default UpdateAssoMemberE2ESpec;
