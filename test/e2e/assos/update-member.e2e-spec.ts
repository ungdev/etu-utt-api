import { Dummies, e2eSuite } from '#/utils/test_utils';
import {
  createAsso,
  createAssoMembership,
  createAssoMembershipPermission,
  createAssoMembershipRole,
  createUser,
} from '#/utils/fakedb';
import * as pactum from 'pactum';
import { ERROR_CODE } from '@/exceptions';
import { PrismaService } from '@/prisma/prisma.service';
import { faker } from '@faker-js/faker';
import { DEFAULT_APPLICATION } from '#/../prisma/seed/utils';
import { AuthService } from '@/auth/auth.service';

const UpdateAssoMemberE2ESpec = e2eSuite('PATCH /assos/:id/members/:id', (app) => {
  const userNotAllowed = createUser(app);
  const userAllowed = createUser(app);
  const userInAsso = createUser(app);
  const otherUserInAsso = createUser(app);
  const asso = createAsso(app);
  const asso2 = createAsso(app);
  const assoMembershipRoleInAsso = createAssoMembershipRole(app, { asso });
  const assoMembershipRole2InAsso = createAssoMembershipRole(app, { asso });
  const manageMembersPermission = createAssoMembershipPermission(app, { id: 'manage_members' });
  const otherPermission = createAssoMembershipPermission(app, { id: 'destroy_etuutt' });
  const userInAssoMembershipInAsso = createAssoMembership(app, {
    asso,
    role: assoMembershipRoleInAsso,
    user: userInAsso,
  });
  createAssoMembership(app, { asso, role: assoMembershipRole2InAsso, user: userInAsso });
  const userInAssoMembershipInAsso2 = createAssoMembership(app, {
    asso: asso2,
    role: assoMembershipRoleInAsso,
    user: userInAsso,
  });
  const otherUserInAssoMembershipInAsso = createAssoMembership(app, {
    asso,
    role: assoMembershipRoleInAsso,
    user: otherUserInAsso,
  });
  createAssoMembership(app, {
    asso,
    role: assoMembershipRoleInAsso,
    user: userAllowed,
    permissions: [manageMembersPermission],
  });

  const endAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);

  it('should return 401 as user is not authenticated', () =>
    pactum
      .spec()
      .patch(`/assos/${asso.id}/members/${userInAssoMembershipInAsso.id}`)
      .withBody({
        roleId: assoMembershipRoleInAsso.id,
        permissions: [manageMembersPermission.id],
        endAt,
      })
      .expectAppError(ERROR_CODE.NOT_LOGGED_IN));

  it('should return a 400 as the asso id param is not valid', () =>
    pactum
      .spec()
      .withBearerToken(userNotAllowed.token)
      .patch(`/assos/thisisnotavaliduuid/members/${userInAssoMembershipInAsso.id}`)
      .withBody({
        roleId: assoMembershipRoleInAsso.id,
        permissions: [manageMembersPermission.id],
        endAt,
      })
      .expectAppError(ERROR_CODE.PARAM_NOT_UUID, 'assoId'));

  it('should return a 400 as the member id param is not valid', () =>
    pactum
      .spec()
      .withBearerToken(userNotAllowed.token)
      .patch(`/assos/${asso.id}/members/thisisnotavaliduuid`)
      .withBody({
        roleId: assoMembershipRoleInAsso.id,
        permissions: [manageMembersPermission.id],
        endAt,
      })
      .expectAppError(ERROR_CODE.PARAM_NOT_UUID, 'memberId'));

  it('should return a 400 as expiration date is in the past', () =>
    pactum
      .spec()
      .withBearerToken(userAllowed.token)
      .patch(`/assos/${asso.id}/members/${userInAssoMembershipInAsso.id}`)
      .withBody({
        permissions: [manageMembersPermission.id],
        endAt: new Date(),
      })
      .expectAppError(ERROR_CODE.PARAM_PAST_DATE, 'endAt'));

  it('should return a 404 as asso is not found', () =>
    pactum
      .spec()
      .withBearerToken(userNotAllowed.token)
      .patch(`/assos/${Dummies.UUID}/members/${userInAssoMembershipInAsso.id}`)
      .withBody({
        roleId: assoMembershipRoleInAsso.id,
        permissions: [manageMembersPermission.id],
        endAt,
      })
      .expectAppError(ERROR_CODE.NO_SUCH_ASSO, Dummies.UUID));

  it('should return a 404 as member is not found', () =>
    pactum
      .spec()
      .withBearerToken(userNotAllowed.token)
      .patch(`/assos/${asso.id}/members/${Dummies.UUID}`)
      .withBody({
        roleId: assoMembershipRoleInAsso.id,
        permissions: [manageMembersPermission.id],
        endAt,
      })
      .expectAppError(ERROR_CODE.NO_SUCH_ASSO_MEMBERSHIP, Dummies.UUID));

  it('should return a 403 as user has no permission', () =>
    pactum
      .spec()
      .withBearerToken(userNotAllowed.token)
      .patch(`/assos/${asso.id}/members/${userInAssoMembershipInAsso.id}`)
      .withBody({
        roleId: assoMembershipRoleInAsso.id,
        permissions: [manageMembersPermission.id],
        endAt,
      })
      .expectAppError(ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS, asso.id, manageMembersPermission.id));

  it('should fail as membership is not part of this Asso', () =>
    pactum
      .spec()
      .withBearerToken(userAllowed.token)
      .patch(`/assos/${asso.id}/members/${userInAssoMembershipInAsso2.id}`)
      .withBody({
        roleId: assoMembershipRoleInAsso.id,
        permissions: [manageMembersPermission.id],
        endAt,
      })
      .expectAppError(ERROR_CODE.NO_SUCH_ASSO_MEMBERSHIP, userInAssoMembershipInAsso2.id));

  it('should return a 404 as role does not exist', () =>
    pactum
      .spec()
      .withBearerToken(userAllowed.token)
      .patch(`/assos/${asso.id}/members/${userInAssoMembershipInAsso.id}`)
      .withBody({
        roleId: Dummies.UUID,
        permissions: [manageMembersPermission.id],
        endAt,
      })
      .expectAppError(ERROR_CODE.NO_SUCH_ASSO_ROLE, asso.id));

  it('should return a 403 as user grants a permission he does not have', () =>
    pactum
      .spec()
      .withBearerToken(userAllowed.token)
      .patch(`/assos/${asso.id}/members/${userInAssoMembershipInAsso.id}`)
      .withBody({
        permissions: [manageMembersPermission.id, otherPermission.id],
        endAt,
      })
      .expectAppError(
        ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS,
        asso.id,
        [manageMembersPermission.id, otherPermission.id].join(', '),
      ));

  it('should fail as user is already in the AssoRole', () =>
    pactum
      .spec()
      .withBearerToken(userAllowed.token)
      .patch(`/assos/${asso.id}/members/${userInAssoMembershipInAsso.id}`)
      .withBody({
        roleId: assoMembershipRole2InAsso.id,
        permissions: [],
        endAt,
      })
      .expectAppError(ERROR_CODE.USER_ALREADY_ASSO_ROLE_MEMBER, assoMembershipRole2InAsso.name));

  it('should update the membership', () => {
    userInAssoMembershipInAsso.endAt = endAt;
    return pactum
      .spec()
      .withBearerToken(userAllowed.token)
      .patch(`/assos/${asso.id}/members/${userInAssoMembershipInAsso.id}`)
      .withBody({
        permissions: [manageMembersPermission.id],
        endAt,
      })
      .expectAssoMembership({
        id: userInAssoMembershipInAsso.id,
        assoId: asso.id,
        userId: userInAsso.id,
        roleId: assoMembershipRoleInAsso.id,
        startAt: userInAssoMembershipInAsso.startAt,
        endAt: userInAssoMembershipInAsso.endAt,
      });
  });

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
    otherUserInAssoMembershipInAsso.endAt = endAt;
    return pactum
      .spec()
      .withBearerToken(token)
      .patch(`/assos/${asso.id}/members/${otherUserInAssoMembershipInAsso.id}`)
      .withBody({
        permissions: [manageMembersPermission.id],
        endAt,
      })
      .expectAssoMembership({
        id: otherUserInAssoMembershipInAsso.id,
        assoId: asso.id,
        userId: otherUserInAsso.id,
        roleId: assoMembershipRoleInAsso.id,
        startAt: otherUserInAssoMembershipInAsso.startAt,
        endAt: otherUserInAssoMembershipInAsso.endAt,
      });
  });
});

export default UpdateAssoMemberE2ESpec;
