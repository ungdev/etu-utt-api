import { createUser, suite } from '../../test_utils';
import * as pactum from 'pactum';
import { HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../src/prisma/prisma.service';

const GetCurrentUserE2ESpec = suite('GET /users/current', (app) => {
  const user = createAsso(app);
  const userAssos = createUser(app, { login: 'userToSearch', studentId: 2 });

  it('should return a 401 as user is not authenticated', () => {
    return pactum
      .spec()
      .get('/users/abcdef/associations')
      .expectStatus(HttpStatus.UNAUTHORIZED);
  });

  it('should return a 404 as user was not found', () => {
    return pactum
      .spec()
      .get('/users/abcdef/associations')
      .withBearerToken(user.token)
      .expectStatus(HttpStatus.NOT_FOUND);
  });

  it('should successfully find the user', async () => {
    const userFromDb = await app()
      .get(PrismaService)
      .user.findMany({
        where: { login: userAssos.login },
        include: {
            
        },
      });
    const expectedBody = {
      id: userFromDb.id,
      firstName: userFromDb.firstName,
      lastName: userFromDb.lastName
    };

    return pactum
      .spec()
      .get(`/users/`)
      .withBearerToken(user.token)
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