import { createUser, e2eSuite } from '../../test_utils';
import * as pactum from 'pactum';
import { HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../src/prisma/prisma.service';

const FindE2ESpec = e2eSuite('Find', (app) => {
  const user = createUser(app);
  const userToSearch = createUser(app, { login: 'userToSearch', studentId: 2 });

  it('should return a 401 as user is not authenticated', () => {
    return pactum.spec().get('/users/abcdef').expectStatus(HttpStatus.UNAUTHORIZED);
  });

  it('should return a 404 as user was not found', () => {
    return pactum.spec().get('/users/abcdef').withBearerToken(user.token).expectStatus(HttpStatus.NOT_FOUND);
  });

  it('should successfully find the user', async () => {
    const userFromDb = await app()
      .get(PrismaService)
      .user.findUnique({
        where: { login: userToSearch.login },
        include: { infos: true },
      });
    const expectedBody = {
      id: userFromDb.id,
      studentId: userFromDb.studentId,
      firstName: userFromDb.firstName,
      lastName: userFromDb.lastName,
      nickname: userFromDb.infos.nickname,
      sex: userFromDb.infos.sex,
    };
    return pactum
      .spec()
      .get(`/users/${expectedBody.id}`)
      .withBearerToken(user.token)
      .expectStatus(HttpStatus.OK)
      .expectBody(expectedBody);
  });
});

export default FindE2ESpec;
