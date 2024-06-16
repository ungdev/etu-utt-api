import { e2eSuite } from '../../../utils/test_utils';
import * as pactum from 'pactum';
import { createUECreditCategory } from '../../../utils/fakedb';

const GetAllCreditCategories = e2eSuite('GET /ue/credit', (app) => {
  const creditCategory1 = createUECreditCategory(app);
  const creditCategory2 = createUECreditCategory(app);

  it('should return all credit categories', () => {
    return pactum
      .spec()
      .get('/ue/credit')
      .expectCreditCategories([creditCategory1, creditCategory2].mappedSort((creditCategory) => creditCategory.code));
  });
});

export default GetAllCreditCategories;
