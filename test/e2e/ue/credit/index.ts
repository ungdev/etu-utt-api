import GetAllCreditCategories from '#/e2e/ue/credit/get-credit-categories.e2e-spec.js';
import { describe } from 'vitest';
import { E2EAppProvider } from '#/utils/test_utils';

export default function CreditE2ESpec(app: E2EAppProvider) {
  describe.skip('Credit', () => {
    GetAllCreditCategories(app);
  });
}
