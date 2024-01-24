import { createUser, suite, createCriterion } from '../../test_utils';
import * as pactum from 'pactum';

const GetRateCriteria = suite('GET /ue/rate/criteria', (app) => {
  const user = createUser(app);
  const criteria = [];
  for (let i = 0; i < 30; i++)
    criteria.push(createCriterion(app, `criterion-${`${i}`.padStart(2, '0')}`));

  it('should return all the criteria', () => {
    return pactum
      .spec()
      .get('/ue/rate/criteria')
      .withBearerToken(user.token)
      .expectUECriteria(criteria);
  });
});

export default GetRateCriteria;
