import * as pactum from 'pactum';
import { e2eSuite } from '../../utils/test_utils';
import * as fakedb from '../../utils/fakedb';
import { ERROR_CODE } from '../../../src/exceptions';
import { ConfigModule } from '../../../src/config/config.module';

const SearchE2ESpec = e2eSuite('GET /users', (app) => {
  const user = fakedb.createUser(app, {
    lastName: 'zis is sad, i am last in the alphabet :(',
    firstName: 'thi mizing lettr',
  });

  const randomUsers = [];
  for (let i = 0; i < 30; i++)
    randomUsers.push(
      fakedb.createUser(app, {
        login: `user${i}`,
        studentId: 70,
        lastName: `other${i}`,
        firstName: 'user',
        userType: 'STUDENT',
        infos: {
          sex: 'MALE',
          birthday: new Date(Date.UTC(1998, 12, 4)),
          nickname: 'nickname',
        },
      }),
    );

  beforeAll(() => {
    randomUsers.mappedSort((user) => [user.lastName, user.firstName]);
  });

  it('should return a 401 because user is not authenticated', async () => {
    return pactum.spec().get('/users').expectAppError(ERROR_CODE.NOT_LOGGED_IN);
  });

  it('should return both users by searching by their firstName', async () => {
    return pactum
      .spec()
      .get('/users?firstName=s')
      .withBearerToken(user.token)
      .expectUsers(app, randomUsers.slice(0, app().get(ConfigModule).PAGINATION_PAGE_SIZE), randomUsers.length);
  });

  it('should return a user by searching by their last name', async () =>
    pactum.spec().get(`/users?lastName=${user.lastName}`).withBearerToken(user.token).expectUsers(app, [user], 1));

  it('should return a user by searching by their nickname', async () =>
    pactum
      .spec()
      .get('/users?nickname=nickname')
      .withBearerToken(user.token)
      .expectUsers(app, randomUsers.slice(0, app().get(ConfigModule).PAGINATION_PAGE_SIZE), randomUsers.length));

  it('should return a user by searching with the name field (searching in the first name)', async () =>
    pactum.spec().get(`/users?q=${user.firstName}`).withBearerToken(user.token).expectUsers(app, [user], 1));

  it('should return a user by searching with the name field (searching in the last name)', async () =>
    pactum.spec().get(`/users?q=${user.lastName}`).withBearerToken(user.token).expectUsers(app, [user], 1));
});

export default SearchE2ESpec;
