import SearchE2ESpec from './search.e2e-spec';
import GetE2ESpec from './get.e2e-spec';
import GetRateCriteria from './get-rate-criteria.e2e-spec';
import GetRateE2ESpec from './get-ue-rate.e2e-spec';
import PutRate from './put-rate.e2e-spec';
import DeleteRate from './delete-rate.e2e-spec';
import AnnalsE2ESpec from './annals';
import CommentsE2ESpec from './comments';
import GetMyUesE2ESpec from './get-my-ues.e2e-spec';
import { E2EAppProvider } from '../../utils/test_utils';
import CreditE2ESpec from './credit';

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
