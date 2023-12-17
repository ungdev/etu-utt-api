import { INestApplication } from '@nestjs/common';
import SearchE2ESpec from './search-e2e-spec';
import GetE2ESpec from './get-e2e-spec';
import GetRateCriteria from './get-rate-criteria-e2e-spec';
import GetCommentsE2ESpec from './get-comment.e2e-spec';
import GetRateE2ESpec from './get-ue-rate.e2e-spec';
import PostCommment from './post-comment.e2e-spec';
import PostCommmentReply from './post-reply.e2e-spec';
import UpdateComment from './update-comment.e2e-spec';

export default function UEE2ESpec(app: () => INestApplication) {
  describe('UE', () => {
    SearchE2ESpec(app);
    GetE2ESpec(app);
    GetRateCriteria(app);
    GetCommentsE2ESpec(app);
    GetRateE2ESpec(app);
    PostCommment(app);
    PostCommmentReply(app);
    UpdateComment(app);
  });
}
