import { createUser, createAsso, suite } from '../../test_utils';
import * as pactum from 'pactum';
import { HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../src/prisma/prisma.service';

const GetCurrentUserE2ESpec = suite('GET /users/current', (app) => {
  const asso = createAsso(app);
  const userAssos = createUser(app, { login: 'userToSearch', userId: 'oui' });

  // TODO : replace studentId by id
  it('should return a 401 as user is not authenticated', () => {
    return pactum
      .spec()
      .get(`/users/${userAssos.studentId}/associations`)
      .expectStatus(HttpStatus.UNAUTHORIZED);
  });

  it('should return a 404 as asso was not found', () => {
    return pactum
      .spec()
      .get('/users/abcdef/associations')
      .withBearerToken(asso.token)
      .expectStatus(HttpStatus.NOT_FOUND);
  });

  it('should successfully find the asso', async () => {
    const userFromDb = await app()
      .get(PrismaService)
      .assoMembership.findMany({
        where: { userId: userAssos.userId },
        include: {},
      });
    const expectedBody = {};

    return pactum
      .spec()
      .get(`/users/${userFromDb.userId}/associations`)
      .withBearerToken(asso.token)
      .expectStatus(HttpStatus.OK)
      .expectBody(
        Object.fromEntries(
          Object.entries(expectedBody).filter(
            ([, value]) => value !== undefined,
          ),
        ),
      );
  });
});

export default GetCurrentUserE2ESpec;
