import GetAllCreditCategories from './get-credit-categories.e2e-spec';
import { E2EAppProvider } from '../../../utils/test_utils';

export default function CreditE2ESpec(app: E2EAppProvider) {
  describe.skip('Credit', () => {
    GetAllCreditCategories(app);
  });
}
