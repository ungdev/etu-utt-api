import { createUE, createUser, suite } from '../../test_utils';
import * as pactum from 'pactum';
import { ERROR_CODE } from 'src/exceptions';

// TODO: checker les rates

const GetE2ESpec = suite('GET /ue/{ueCode}', (app) => {
  const user = createUser(app);
  const ues = [];
  for (let i = 0; i < 30; i++)
    ues.push(
      createUE(app, {
        code: `XX${`${i}`.padStart(2, '0')}`,
        semester: i % 2 == 1 ? 'A24' : 'P24',
        category: i % 3 == 0 ? 'CS' : 'TM',
        filiere: i % 4 == 0 ? 'T1' : 'T2',
        branch: i % 5 == 0 ? 'B1' : 'B2',
      }),
    );

  it('should return a 401 as user is not authenticated', () => {
    return pactum
      .spec()
      .get('/ue/XX01')
      .expectAppError(ERROR_CODE.NOT_LOGGED_IN);
  });

  it('should return an error if the ue does not exist', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue/AA01')
      .expectAppError(ERROR_CODE.NO_SUCH_UE, 'AA01');
  });

  it('should return the UE XX01', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue/XX01')
      .expectUE(ues.find((ue) => ue.code === 'XX01'));
  });
});

export default GetE2ESpec;
