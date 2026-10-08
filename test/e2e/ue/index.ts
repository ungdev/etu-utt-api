import { INestApplication } from '@nestjs/common';
import SearchE2ESpec from '#/e2e/ue/search.e2e-spec.js';
import GetE2ESpec from '#/e2e/ue/get.e2e-spec.js';
import GetRateCriteria from '#/e2e/ue/get-rate-criteria.e2e-spec.js';
import GetRateE2ESpec from '#/e2e/ue/get-ue-rate.e2e-spec.js';
import PutRate from '#/e2e/ue/put-rate.e2e-spec.js';
import DeleteRate from '#/e2e/ue/delete-rate.e2e-spec.js';
import AnnalsE2ESpec from '#/e2e/ue/annals/index.js';
import CommentsE2ESpec from '#/e2e/ue/comments/index.js';
import GetMyUesE2ESpec from '#/e2e/ue/get-my-ues.e2e-spec.js';
import CreditE2ESpec from '#/e2e/ue/credit/index.js';
import { describe } from 'vitest';

export default function UeE2ESpec(app: () => INestApplication) {
  describe('UE', () => {
    SearchE2ESpec(app);
    GetE2ESpec(app);
    GetRateCriteria(app);
    GetRateE2ESpec(app);
    PutRate(app);
    DeleteRate(app);
    CommentsE2ESpec(app);
    AnnalsE2ESpec(app);
    CreditE2ESpec(app);
    GetMyUesE2ESpec(app);
  });
}
