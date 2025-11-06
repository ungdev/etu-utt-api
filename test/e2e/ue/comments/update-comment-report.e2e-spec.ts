import * as pactum from 'pactum';
import { ERROR_CODE } from 'src/exceptions';
import { PrismaService } from '../../../../src/prisma/prisma.service';
import {
  createBranch,
  createBranchOption,
  createComment,
  createCommentReport,
  createCommentReportReason,
  createSemester,
  createUe,
  createUeof,
  createUser,
} from '../../../utils/fakedb';
import { Dummies, e2eSuite } from '../../../utils/test_utils';
import { PermissionManager } from '../../../../src/utils';

const UpdateCommentReport = e2eSuite('PATCH /ue/comments/:commentId/:reportId', (app) => {
  const user = createUser(app, { permissions: new PermissionManager().with('API_MODERATE_COMMENTS') });
  const semester = createSemester(app);
  const branch = createBranch(app);
  const branchOption = createBranchOption(app, { branch });
  const ue = createUe(app);
  const ueof = createUeof(app, { branchOptions: [branchOption], semesters: [semester], ue });
  const reason = createCommentReportReason(app, { name: 'meh' });
  const comment = createComment(app, { user, ueof, semester });
  const report = createCommentReport(app, { comment, reason, user });

  it('should return a 401 as user is not authenticated', () => {
    return pactum.spec().patch(`/ue/comments/${comment.id}/${report.id}`).expectAppError(ERROR_CODE.NOT_LOGGED_IN);
  });

  it('should return a 403 as user does not have permission to moderate comments', async () => {
    const userNoPermission = await createUser(app, {}, true);
    const userNotModerator = await createUser(
      app,
      { permissions: new PermissionManager().with('API_SEE_OPINIONS_UE').with('API_GIVE_OPINIONS_UE') },
      true,
    );
    await pactum
      .spec()
      .withBearerToken(userNoPermission.token)
      .patch(`/ue/comments/${comment.id}/${report.id}`)
      .expectAppError(ERROR_CODE.FORBIDDEN_NOT_ENOUGH_API_PERMISSIONS, 'API_MODERATE_COMMENTS');
    await pactum
      .spec()
      .withBearerToken(userNotModerator.token)
      .patch(`/ue/comments/${comment.id}/${report.id}`)
      .expectAppError(ERROR_CODE.FORBIDDEN_NOT_ENOUGH_API_PERMISSIONS, 'API_MODERATE_COMMENTS');
  });

  it('should return 404 as commentId is invalid', async () => {
    await pactum
      .spec()
      .withBearerToken(user.token)
      .patch(`/ue/comments/${Dummies.UUID}/${report.id}`)
      .expectAppError(ERROR_CODE.NO_SUCH_COMMENT);
  });

  it('should return 404 as reportId is invalid', async () => {
    await pactum
      .spec()
      .withBearerToken(user.token)
      .patch(`/ue/comments/${comment.id}/${Dummies.UUID}`)
      .expectAppError(ERROR_CODE.NO_SUCH_REPORT);
  });

  it('should return the updated report', async () => {
    await pactum
      .spec()
      .withBearerToken(user.token)
      .patch(`/ue/comments/${comment.id}/${report.id}`)
      .expectUeCommentReport({
        ...report,
        mitigated: true,
      });
    await app()
      .get(PrismaService)
      .ueCommentReport.update({
        where: {
          id: report.id,
        },
        data: {
          mitigated: false,
        },
      });
  });
});

export default UpdateCommentReport;
