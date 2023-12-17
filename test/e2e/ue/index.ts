import { INestApplication } from '@nestjs/common';
import SearchE2ESpec from './search-e2e-spec';
import GetE2ESpec from './get-e2e-spec';
import GetRateCriteria from './get-rate-criteria-e2e-spec';
import GetCommentsE2ESpec from './get-comment.e2e-spec';

export default function UEE2ESpec(app: () => INestApplication) {
  describe('UE', () => {
    SearchE2ESpec(app);
    GetE2ESpec(app);
    GetRateCriteria(app);
    GetCommentsE2ESpec(app);
  });
}
