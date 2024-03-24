import * as pactum from 'pactum';
import { e2eSuite } from '../../utils/test_utils';
import * as fakedb from '../../utils/fakedb';
import { pick } from '../../../src/utils';
import { ERROR_CODE } from '../../../src/exceptions';

function userToBodyUser(user: fakedb.FakeUser) {
  return pick(user, 'id', 'firstName', 'lastName', 'nickname');
}

const SearchE2ESpec = e2eSuite('GET /users', (app) => {
  const user = fakedb.createUser(app, {
    login: 'users',
    sex: 'FEMALE',
    studentId: 69,
    lastName: 'profile',
    firstName: 'profile',
    userType: 'STUDENT',
    birthday: new Date(Date.UTC(2000, 1, 1)),
  });
  const otherUser = fakedb.createUser(app, {
    login: 'otheruser',
    sex: 'MALE',
    studentId: 70,
    lastName: 'other',
    firstName: 'user',
    userType: 'STUDENT',
    birthday: new Date(Date.UTC(1998, 12, 4)),
    nickname: 'nickname',
  });

  it('should return a 401 because user is not authenticated', async () => {
    return pactum.spec().get('/users').expectAppError(ERROR_CODE.NOT_LOGGED_IN);
  });

  it('should return both users by searching by their firstName', async () => {
    return pactum
      .spec()
      .get('/users?firstName=e')
      .withBearerToken(user.token)
      .expectStatus(200)
      .expectBody([userToBodyUser(otherUser), userToBodyUser(user)]);
  });

  it('should return a user by searching by their last name', async () =>
    pactum
      .spec()
      .get(`/users?lastName=${user.lastName}`)
      .withBearerToken(user.token)
      .expectStatus(200)
      .expectBody([userToBodyUser(user)]));

  it('should return a user by searching by their nickname', async () =>
    pactum
      .spec()
      .get('/users?nickname=nickname')
      .withBearerToken(user.token)
      .expectStatus(200)
      .expectBody([userToBodyUser(otherUser)]));

  it('should return a user by searching with the name field (searching in the first name)', async () =>
    pactum
      .spec()
      .get(`/users?name=${user.firstName}`)
      .withBearerToken(user.token)
      .expectStatus(200)
      .expectBody([userToBodyUser(user)]));

  it('should return a user by searching with the name field (searching in the last name)', async () =>
    pactum
      .spec()
      .get(`/users?name=${user.lastName}`)
      .withBearerToken(user.token)
      .expectStatus(200)
      .expectBody([userToBodyUser(user)]));
});

export default SearchE2ESpec;
