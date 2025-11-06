import * as pactum from 'pactum';
import { ERROR_CODE } from 'src/exceptions';
import { PrismaService } from '../../../../src/prisma/prisma.service';
import {
  createBranch,
  createBranchOption,
  createComment,
  createCommentReply,
  createCommentReplyReport,
  createCommentReportReason,
  createSemester,
  createUe,
  createUeof,
  createUser,
} from '../../../utils/fakedb';
import { Dummies, e2eSuite } from '../../../utils/test_utils';
import { PermissionManager } from '../../../../src/utils';

const UpdateCommentReplyReport = e2eSuite('PATCH /ue/comments/reply/{replyId}/{reportId}', (app) => {
  const commentAuthor = createUser(app, {
    permissions: new PermissionManager().with('API_SEE_OPINIONS_UE').with('API_GIVE_OPINIONS_UE'),
  });
  const replyAuthor = createUser(app, {
    permissions: new PermissionManager().with('API_SEE_OPINIONS_UE').with('API_GIVE_OPINIONS_UE'),
  });
  const moderator = createUser(app, { permissions: new PermissionManager().with('API_MODERATE_COMMENTS') });
  const semester = createSemester(app);
  const branch = createBranch(app);
  const branchOption = createBranchOption(app, { branch });
  const ue = createUe(app);
  const ueof = createUeof(app, { branchOptions: [branchOption], semesters: [semester], ue });
  const reason = createCommentReportReason(app, { name: 'meh' });
  const comment = createComment(app, { user: commentAuthor, ueof, semester });
  const reply = createCommentReply(app, { user: replyAuthor, comment });
  const report = createCommentReplyReport(app, { reply, reason, user: commentAuthor });

  it('should return a 401 as user is not authenticated', () => {
    return pactum.spec().patch(`/ue/comments/reply/${reply.id}/${report.id}`).expectAppError(ERROR_CODE.NOT_LOGGED_IN);
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
      .patch(`/ue/comments/reply/${reply.id}/${report.id}`)
      .expectAppError(ERROR_CODE.FORBIDDEN_NOT_ENOUGH_API_PERMISSIONS, 'API_MODERATE_COMMENTS');
    await pactum
      .spec()
      .withBearerToken(userNotModerator.token)
      .patch(`/ue/comments/reply/${reply.id}/${report.id}`)
      .expectAppError(ERROR_CODE.FORBIDDEN_NOT_ENOUGH_API_PERMISSIONS, 'API_MODERATE_COMMENTS');
  });

  it('should return 404 as replyId is invalid', async () => {
    await pactum
      .spec()
      .withBearerToken(moderator.token)
      .patch(`/ue/comments/reply/${Dummies.UUID}/${report.id}`)
      .expectAppError(ERROR_CODE.NO_SUCH_REPLY);
  });

  it('should return 404 as reportId is invalid', async () => {
    await pactum
      .spec()
      .withBearerToken(moderator.token)
      .patch(`/ue/comments/reply/${reply.id}/${Dummies.UUID}`)
      .expectAppError(ERROR_CODE.NO_SUCH_REPORT);
  });

  it('should return the updated report', async () => {
    await pactum
      .spec()
      .withBearerToken(moderator.token)
      .patch(`/ue/comments/reply/${reply.id}/${report.id}`)
      .expectUeCommentReport({
        ...report,
        mitigated: true,
        createdAt: report.createdAt,
      });
    await app()
      .get(PrismaService)
      .ueCommentReplyReport.update({
        where: {
          id: report.id,
        },
        data: {
          mitigated: false,
        },
      });
  });
});

export default UpdateCommentReplyReport;
