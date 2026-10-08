import { INestApplication } from '@nestjs/common';
import GetAllCreditCategories from '#/e2e/ue/credit/get-credit-categories.e2e-spec.js';
import { describe } from 'vitest';

export default function CreditE2ESpec(app: () => INestApplication) {
  describe('Credit', () => {
    GetAllCreditCategories(app);
  });
}
