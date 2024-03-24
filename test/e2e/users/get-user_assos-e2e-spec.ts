
import { e2eSuite } from '../../utils/test_utils';
import { createUser } from '../../utils/fakedb';
import * as pactum from 'pactum';
import { HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../src/prisma/prisma.service';
//import { createAsso } from '../../test_utils';

const GetUserAssociationE2ESpec = e2eSuite('GET /users/:userId/associations', (app) => {
  //const asso = createAsso(app);
  const userAssos = createUser(app, { login: 'userToSearch', id: 'oui' });

  it('should return a 401 as user is not authenticated', () => {
    return pactum.spec().get(`/users/${userAssos.id}/associations`).expectStatus(HttpStatus.UNAUTHORIZED);
  });

  it('should return a 404 as asso was not found', () => {
    return pactum
      .spec()
      .get('/users/abcdef/associations')
      .withBearerToken(userAssos.token)
      .expectStatus(HttpStatus.NOT_FOUND);
  });

  it('should successfully find the asso', async () => {
    const assoMembershipFromDb = await app()
      .get(PrismaService)
      .assoMembership.findMany({
        where: { userId: userAssos.id },
        select: {
          startAt: true,
          endAt: true,
          roles: {
            select: {
              role: true,
            },
          },
          asso: {
            select: {
              name: true,
              logo: true,
              descriptionShortTranslationId: true,
              mail: true,
            },
          },
        },
      });

    return pactum
      .spec()
      .get(`/users/${userAssos.id}/associations`)
      .withBearerToken(userAssos.token)
      .expectStatus(HttpStatus.OK)
      .expectBody(Object.fromEntries(Object.entries(assoMembershipFromDb).filter(([, value]) => value !== undefined)));
  });
});

export default GetUserAssociationE2ESpec;
