import { omit } from '../../../src/utils';
import { createUser, createCriterion, FakeUEStarCriterion } from '../../utils/fakedb';
import { e2eSuite } from '../../utils/test_utils';
import * as pactum from 'pactum';

const GetRateCriteria = e2eSuite('GET /ue/rate/criteria', (app) => {
  const user = createUser(app);
  const criteria: FakeUEStarCriterion[] = [];
  for (let i = 0; i < 30; i++) criteria.push(createCriterion(app));

  it('should return all the criteria', () => {
    return pactum
      .spec()
      .get('/ue/rate/criteria')
      .withBearerToken(user.token)
      .expectUECriteria(
        criteria.map(omit('descriptionTranslationId')).sort((a, b) => (a.name < b.name ? -1 : 1)) as Required<
          Omit<FakeUEStarCriterion, 'descriptionTranslationId'>
        >[],
      );
  });
});

export default GetRateCriteria;
