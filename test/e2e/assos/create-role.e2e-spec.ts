import { Dummies, e2eSuite, JsonLike } from '#/utils/test_utils';
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
import { DEFAULT_APPLICATION } from '../../../prisma/seed/utils';
import { AuthService } from '@/auth/auth.service';

const CreateAssoRoleE2ESpec = e2eSuite('POST /assos/:id/roles', (app) => {
  const user = createUser(app);
  const userAllowed = createUser(app);
  const asso = createAsso(app);
  const assoMembershipRole = createAssoMembershipRole(app, { asso });
  const permission = createAssoMembershipPermission(app, { id: 'manage_roles' });
  createAssoMembership(app, { asso, role: assoMembershipRole, user: userAllowed, permissions: [permission] });
  const validBody = {
    name: 'Bouffeur de carte graphiques',
  };

  it('should return 403 as user is not authenticated', () =>
    pactum.spec().post(`/assos/${asso.id}/roles`).expectAppError(ERROR_CODE.NOT_LOGGED_IN));

  it('should return a 400 as the id param is not valid', () =>
    pactum
      .spec()
      .withBearerToken(user.token)
      .post('/assos/thisisnotavaliduuid/roles')
      .withBody(validBody)
      .expectAppError(ERROR_CODE.PARAM_NOT_UUID, 'assoId'));

  it('should return a 404 as asso is not found', () =>
    pactum
      .spec()
      .withBearerToken(user.token)
      .post(`/assos/${Dummies.UUID}/roles`)
      .withBody(validBody)
      .expectAppError(ERROR_CODE.NO_SUCH_ASSO, Dummies.UUID));

  it('should return a 403 as user has no permission', () =>
    pactum
      .spec()
      .withBearerToken(user.token)
      .post(`/assos/${asso.id}/roles`)
      .withBody(validBody)
      .expectAppError(ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS, asso.id, permission.id));

  it('should create the role', () =>
    pactum
      .spec()
      .withBearerToken(userAllowed.token)
      .post(`/assos/${asso.id}/roles`)
      .withBody(validBody)
      .expectAssoMembershipRoleCreated({
        id: JsonLike.UUID,
        isPresident: false,
        name: validBody.name,
        position: 2, // position 0 is by default the president role and we already have created a role at position 1
        assoId: asso.id,
      }));

  it('should create the role with asso account', async () => {
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
      .post(`/assos/${asso.id}/roles`)
      .withBody(validBody)
      .expectAssoMembershipRoleCreated({
        id: JsonLike.UUID,
        isPresident: false,
        name: validBody.name,
        position: 3,
        assoId: asso.id,
      });
  });
});

export default CreateAssoRoleE2ESpec;
