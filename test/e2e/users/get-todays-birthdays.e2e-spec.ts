import { e2eSuite } from '../../utils/test_utils';
import * as pactum from 'pactum';
import { createUser } from '../../utils/fakedb';
import { ERROR_CODE } from '../../../src/exceptions';

const GetTodaysBirthdaysE2ESpec = e2eSuite('GET /users/birthday/today', (app) => {
  const now = new Date();
  const user = createUser(app, { infos: { birthday: new Date(now.getTime() - 3_600_000 * 24) } });
  const otherUser = createUser(app, {
    infos: {
      birthday: new Date(now.getUTCFullYear() - 15, now.getUTCMonth(), now.getUTCDate()),
    },
  }); // Bro you are 15 years old wtf gaudry like

  it('should fail as user is not authenticated', () =>
    pactum.spec().get('/users/birthdays/today').expectAppError(ERROR_CODE.NOT_LOGGED_IN));

  it('should return the birthday of the user', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/users/birthdays/today')
      .expectStatus(200)
      .expectJsonMatchStrict([
        {
          id: otherUser.id,
          firstName: otherUser.firstName,
          lastName: otherUser.lastName,
          nickname: otherUser.infos.nickname,
          age: 15,
        },
      ]);
  });
});

export default GetTodaysBirthdaysE2ESpec;
