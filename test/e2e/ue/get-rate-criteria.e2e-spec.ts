import { omit } from '../../../src/utils';
import { createUser, createCriterion, FakeUeStarCriterion } from '../../utils/fakedb';
import { e2eSuite } from '../../utils/test_utils';
import * as pactum from 'pactum';

const GetRateCriteria = e2eSuite('GET /ue/rate/criteria', (app) => {
  const user = createUser(app);
  const criteria: FakeUeStarCriterion[] = [];
  for (let i = 0; i < 30; i++) criteria.push(createCriterion(app));

  it('should return all the criteria', () => {
    return pactum
      .spec()
      .get('/ue/rate/criteria')
      .withBearerToken(user.token)
      .expectUeCriteria(
        criteria.map(omit('descriptionTranslationId')).sort((a, b) => (a.name < b.name ? -1 : 1)) as Required<
          Omit<FakeUeStarCriterion, 'descriptionTranslationId'>
        >[],
      );
  });
});

export default GetRateCriteria;
