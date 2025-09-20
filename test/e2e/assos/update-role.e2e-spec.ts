import { Dummies, e2eSuite } from '../../utils/test_utils';
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

const UpdateAssoRoleE2ESpec = e2eSuite('PUT /assos/:id/roles/:id', (app) => {
  const user = createUser(app);
  const userAllowed = createUser(app);
  const asso = createAsso(app);
  const asso2 = createAsso(app);
  const assoMembershipRole = createAssoMembershipRole(app, { asso });
  const assoMembershipRole2 = createAssoMembershipRole(app, { asso: asso2 });
  const permission = createAssoMembershipPermission(app, { id: 'manage_roles' });
  createAssoMembership(app, { asso, role: assoMembershipRole, user: userAllowed, permissions: [permission] });

  it('should return 403 as user is not authenticated', () =>
    pactum.spec().put(`/assos/${asso.id}/roles/${assoMembershipRole.id}`).expectAppError(ERROR_CODE.NOT_LOGGED_IN));

  it('should return a 400 as the id param is not valid', () =>
    pactum
      .spec()
      .withBearerToken(user.token)
      .put(`/assos/thisisnotavaliduuid/roles/${assoMembershipRole.id}`)
      .withBody({
        name: 'Yippee',
        position: 0,
      })
      .expectAppError(ERROR_CODE.PARAM_NOT_UUID, 'assoId'));

  it('should return a 404 as asso is not found', () =>
    pactum
      .spec()
      .withBearerToken(user.token)
      .put(`/assos/${Dummies.UUID}/roles/${assoMembershipRole.id}`)
      .withBody({
        name: 'Yippee',
        position: 0,
      })
      .expectAppError(ERROR_CODE.NO_SUCH_ASSO, Dummies.UUID));

  it('should return a 403 as user has no permission', () =>
    pactum
      .spec()
      .withBearerToken(user.token)
      .put(`/assos/${asso.id}/roles/${assoMembershipRole.id}`)
      .withBody({
        name: 'Yippee',
        position: 0,
      })
      .expectAppError(ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS, asso.id, permission.id));

  it('should return a 404 as role does not exist', () =>
    pactum
      .spec()
      .withBearerToken(userAllowed.token)
      .put(`/assos/${asso.id}/roles/${Dummies.UUID}`)
      .withBody({
        name: 'Yippee',
        position: 0,
      })
      .expectAppError(ERROR_CODE.NO_SUCH_ASSO_ROLE, asso.id));

  it('should return a 404 as role is from another asso', () =>
    pactum
      .spec()
      .withBearerToken(userAllowed.token)
      .put(`/assos/${asso.id}/roles/${assoMembershipRole2.id}`)
      .withBody({
        name: 'Yippee',
        position: 0,
      })
      .expectAppError(ERROR_CODE.NO_SUCH_ASSO_ROLE, asso.id));

  it('should return a 400 as position is out of range', async () => {
    return pactum
      .spec()
      .withBearerToken(userAllowed.token)
      .put(`/assos/${asso.id}/roles/${assoMembershipRole.id}`)
      .withBody({
        name: 'Yippee',
        position: 128,
      })
      .expectAppError(ERROR_CODE.PARAM_TOO_HIGH, 'position');
  });

  it('should update the role', async () => {
    const presRole = await app()
      .get(PrismaService)
      .assoMembershipRole.findFirstOrThrow({ where: { assoId: asso.id, isPresident: true } });
    return pactum
      .spec()
      .withBearerToken(userAllowed.token)
      .put(`/assos/${asso.id}/roles/${assoMembershipRole.id}`)
      .withBody({
        name: 'Updated',
        position: 0,
      })
      .expectAssoMembershipRoles([
        {
          id: assoMembershipRole.id,
          isPresident: false,
          name: 'Updated',
          position: 0,
          assoId: asso.id,
        },
        { ...presRole, position: 1 },
      ]);
  });

  it('should update the role with asso account', async () => {
    const assoUser = await app()
      .get(PrismaService)
      .user.findUnique({ where: { login: asso.name } });
    const presRole = await app()
      .get(PrismaService)
      .assoMembershipRole.findFirstOrThrow({ where: { assoId: asso.id, isPresident: true } });
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
      .put(`/assos/${asso.id}/roles/${assoMembershipRole.id}`)
      .withBody({
        name: 'Reverted',
        position: 1,
      })
      .expectAssoMembershipRoles([
        { ...presRole, position: 0 },
        {
          id: assoMembershipRole.id,
          isPresident: false,
          name: 'Reverted',
          position: 1,
          assoId: asso.id,
        },
      ]);
  });
});

export default UpdateAssoRoleE2ESpec;
