import * as pactum from 'pactum';
import { ERROR_CODE } from '@/exceptions.js';
import { createCommentReportReason, createUser } from '#/utils/fakedb.js';
import { e2eSuite } from '#/utils/test_utils.js';
import { PermissionManager } from '@/utils.js';
import { it } from 'vitest';

const GetCommentReportReasonE2ESpec = e2eSuite('GET /ue/comments/reports/reasons', (app) => {
  const user = createUser(app, { permissions: new PermissionManager().with('API_SEE_OPINIONS_UE') });
  const userNoPermission = createUser(app);
  createCommentReportReason(app, { name: 'meh' });
  createCommentReportReason(app, { name: 'bad' });

  it('should return a 401 as user is not authenticated', () =>
    pactum.spec().get(`/ue/comments/reports/reasons`).expectAppError(ERROR_CODE.NOT_LOGGED_IN));

  it('should fail as the user does not have the required permissions', () =>
    pactum
      .spec()
      .withBearerToken(userNoPermission.token)
      .get(`/ue/comments/reports/reasons`)
      .expectAppError(ERROR_CODE.FORBIDDEN_NOT_ENOUGH_API_PERMISSIONS, 'API_SEE_OPINIONS_UE'));

  it('should return an array of report reasons', () =>
    pactum
      .spec()
      .withBearerToken(user.token)
      .get(`/ue/comments/reports/reasons`)
      .expectJsonLength(2)
      .expectJsonLike([
        {
          name: 'bad',
          description: 'bonjour',
        },
        {
          name: 'meh',
          description: 'bonjour',
        },
      ]));
});
export default GetCommentReportReasonE2ESpec;
