import { e2eSuite } from '../../utils/test_utils';
import * as pactum from 'pactum';
import { HttpStatus } from '@nestjs/common';
import * as fakedb from '../../utils/fakedb';
import { pick } from '../../../src/utils';

const FindE2ESpec = e2eSuite('GET /users/:userId', (app) => {
  const user = fakedb.createUser(app);
  const userToSearch = fakedb.createUser(app);

  it('should return a 401 as user is not authenticated', () =>
    pactum.spec().get('/users/abcdef').expectStatus(HttpStatus.UNAUTHORIZED));

  it('should return a 404 as user was not found', () =>
    pactum.spec().get('/users/abcdef').withBearerToken(user.token).expectStatus(HttpStatus.NOT_FOUND));

  it('should successfully find the user', async () =>
    pactum
      .spec()
      .get(`/users/${userToSearch.id}`)
      .withBearerToken(user.token)
      .expectStatus(HttpStatus.OK)
      .expectBody(pick(userToSearch, 'id', 'studentId', 'firstName', 'lastName', 'nickname', 'sex')));
});

export default FindE2ESpec;
