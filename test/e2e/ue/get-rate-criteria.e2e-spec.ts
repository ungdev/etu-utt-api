import { omit } from '../../../src/utils';
import { createUser, createCriterion, FakeUeStarCriterion } from '../../utils/fakedb';
import { e2eSuite } from '../../utils/test_utils';
import * as pactum from 'pactum';
import { ERROR_CODE } from '../../../src/exceptions';

const GetRateCriteria = e2eSuite('GET /ue/rate/criteria', (app) => {
  const userNoPermission = createUser(app);
  const user = createUser(app, { permissions: ['API_SEE_OPINIONS_UE'] });
  const criteria: FakeUeStarCriterion[] = [];
  for (let i = 0; i < 30; i++) criteria.push(createCriterion(app));

  it('should fail as the user is not logged in', () =>
    pactum.spec().get('/ue/rate/criteria').expectAppError(ERROR_CODE.NOT_LOGGED_IN));

  it('should fail as the user does not have the right permissions', () =>
    pactum
      .spec()
      .get('/ue/rate/criteria')
      .withBearerToken(userNoPermission.token)
      .expectAppError(ERROR_CODE.FORBIDDEN_NOT_ENOUGH_API_PERMISSIONS, 'API_SEE_OPINIONS_UE'));

  it('should return all the criteria', () => {
    return pactum
      .spec()
      .get('/ue/rate/criteria')
      .withBearerToken(user.token)
      .expectUeCriteria(
        criteria
          .map(omit('descriptionTranslationId'))
          .sort(
            (a, b) => Number(a.name > b.name) - Number(a.name < b.name) || Number(a.id > b.id) - Number(a.id < b.id),
          ) as Required<Omit<FakeUeStarCriterion, 'descriptionTranslationId'>>[],
      );
  });
});

export default GetRateCriteria;
