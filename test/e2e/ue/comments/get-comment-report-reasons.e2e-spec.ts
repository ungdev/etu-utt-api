import * as pactum from 'pactum';
import { ERROR_CODE } from 'src/exceptions';
import { createCommentReportReason, createUser } from '../../../../test/utils/fakedb';
import { e2eSuite } from '../../../../test/utils/test_utils';

const GetCommentReportReason = e2eSuite('GET /ue/comments/reports/reasons', (app) => {
  const user = createUser(app, { permissions: ['API_SEE_OPINIONS_UE'] });
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
          descriptionTranslation: 'bonjour',
        },
        {
          name: 'meh',
          descriptionTranslation: 'bonjour',
        },
      ]));
});
export default GetCommentReportReason;
