import { createUser, createCriterion } from '../../utils/fakedb';
import * as pactum from 'pactum';
import { ERROR_CODE } from 'src/exceptions';
import { e2eSuite } from '../../utils/test_utils';

const GetRateCriteria = e2eSuite('GET /ue/rate/criteria', (app) => {
  const user = createUser(app);
  const criteria = [];
  for (let i = 0; i < 30; i++) criteria.push(createCriterion(app, `criterion-${`${i}`.padStart(2, '0')}`));

  it('should return a 401 as user is not authenticated', () => {
    return pactum.spec().get('/ue/rate/criteria').expectAppError(ERROR_CODE.NOT_LOGGED_IN);
  });

  it('should return all the criteria', () => {
    return pactum.spec().get('/ue/rate/criteria').withBearerToken(user.token).expectUECriteria(criteria);
  });
});

export default GetRateCriteria;
