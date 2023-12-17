import { HttpStatus } from '@nestjs/common';
import { createUser, suite, createCriterion } from '../../test_utils';
import * as pactum from 'pactum';

const GetRateCriteria = suite('Get Rate Criteria', (app) => {
  const user = createUser(app);
  const criteria = [];

  beforeAll(async () => {
    for (let i = 0; i < 30; i++)
      criteria.push(
        await createCriterion(app, `criterion-${`${i}`.padStart(2, '0')}`),
      );
  });

  it('should return a 401 as user is not authenticated', () => {
    return pactum
      .spec()
      .get('/ue/rate/criteria')
      .expectStatus(HttpStatus.UNAUTHORIZED);
  });

  it('should return all the criteria', () => {
    return pactum
      .spec()
      .get('/ue/rate/criteria')
      .withBearerToken(user.token)
      .expectStatus(HttpStatus.OK)
      .expectJsonMatch(criteria);
  });
});

export default GetRateCriteria;
