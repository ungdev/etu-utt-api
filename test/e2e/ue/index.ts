import SearchE2ESpec from '#/e2e/ue/search.e2e-spec';
import GetE2ESpec from '#/e2e/ue/get.e2e-spec';
import GetRateCriteria from '#/e2e/ue/get-rate-criteria.e2e-spec';
import GetRateE2ESpec from '#/e2e/ue/get-ue-rate.e2e-spec';
import PutRate from '#/e2e/ue/put-rate.e2e-spec';
import DeleteRate from '#/e2e/ue/delete-rate.e2e-spec';
import AnnalsE2ESpec from '#/e2e/ue/annals';
import CommentsE2ESpec from '#/e2e/ue/comments';
import GetMyUesE2ESpec from '#/e2e/ue/get-my-ues.e2e-spec';
import { describe } from 'vitest';
import { E2EAppProvider } from '#/utils/test_utils';
import CreditE2ESpec from '#/e2e/ue/credit';

export default function UeE2ESpec(app: E2EAppProvider) {
  describe('UE', () => {
    SearchE2ESpec(app);
    GetE2ESpec(app);
    GetRateCriteria(app);
    GetRateE2ESpec(app);
    PutRate(app);
    DeleteRate(app);
    CommentsE2ESpec(app);
    AnnalsE2ESpec(app);
    CreditE2ESpec(app); // deactivated
    GetMyUesE2ESpec(app);
  });
}
