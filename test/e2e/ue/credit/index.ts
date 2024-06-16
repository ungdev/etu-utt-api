import { INestApplication } from '@nestjs/common';
import GetAllCreditCategories from './get-credit-categories.e2e-spec';

export default function UEE2ESpec(app: () => INestApplication) {
  describe('Credit', () => {
    GetAllCreditCategories(app);
  });
}
