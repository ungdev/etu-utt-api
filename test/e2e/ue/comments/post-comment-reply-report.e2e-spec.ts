import { PermissionManager } from '../../../../src/utils';
import {
  createBranch,
  createBranchOption,
  createComment,
  createCommentReply,
  createCommentReportReason,
  createSemester,
  createUe,
  createUeof,
  createUser,
} from '../../../utils/fakedb';
import { Dummies, e2eSuite, JsonLike } from '../../../utils/test_utils';
import * as pactum from 'pactum';
import { ERROR_CODE } from 'src/exceptions';

const ReportCommentReply = e2eSuite('POST /ue/comments/reply/{replyId}/report', (app) => {
  const commentAuthor = createUser(app, {
    permissions: new PermissionManager().with('API_SEE_OPINIONS_UE').with('API_GIVE_OPINIONS_UE'),
  });
  const replyAuthor = createUser(app, {
    permissions: new PermissionManager().with('API_SEE_OPINIONS_UE').with('API_GIVE_OPINIONS_UE'),
  });
  const userNotAuthor = createUser(app, {
    login: 'user2',
    permissions: new PermissionManager().with('API_SEE_OPINIONS_UE').with('API_GIVE_OPINIONS_UE'),
  });
  const userNoPermission = createUser(app);
  const semester = createSemester(app);
  const branch = createBranch(app);
  const branchOption = createBranchOption(app, { branch });
  const ue = createUe(app);
  const ueof = createUeof(app, { branchOptions: [branchOption], semesters: [semester], ue });
  const comment = createComment(app, { ueof, user: commentAuthor, semester });
  const reply = createCommentReply(app, { user: replyAuthor, comment });
  const reportReason = createCommentReportReason(app, { name: 'meh' });

  it('should return a 401 as user is not authenticated', async () => {
    return await pactum.spec().post(`/ue/comments/reply/${reply.id}/report`).expectAppError(ERROR_CODE.NOT_LOGGED_IN);
  });

  it('should fail as the user does not have the required permissions', async () => {
    return await pactum
      .spec()
      .withBearerToken(userNoPermission.token)
      .post(`/ue/comments/reply/${reply.id}/report`)
      .withBody({
        body: "it's offensive",
        reason: reportReason.name,
      })
      .expectAppError(ERROR_CODE.FORBIDDEN_NOT_ENOUGH_API_PERMISSIONS, 'API_SEE_OPINIONS_UE');
  });

  it('should return 400 because reply id is not a valid UUID', async () => {
    return await pactum
      .spec()
      .withBearerToken(userNotAuthor.token)
      .post(`/ue/comments/reply/notauuid/report`)
      .withBody({
        body: "it's offensive",
        reason: reportReason.name,
      })
      .expectAppError(ERROR_CODE.PARAM_NOT_UUID, 'replyId');
  });

  it('should return 404 because reply does not exist', async () => {
    return await pactum
      .spec()
      .withBearerToken(userNotAuthor.token)
      .post(`/ue/comments/reply/${Dummies.UUID}/report`)
      .withBody({
        body: "it's offensive",
        reason: reportReason.name,
      })
      .expectAppError(ERROR_CODE.NO_SUCH_REPLY);
  });

  it('should return 403 because user is reply author', async () => {
    return await pactum
      .spec()
      .withBearerToken(replyAuthor.token)
      .post(`/ue/comments/reply/${reply.id}/report`)
      .withBody({
        body: "it's offensive",
        reason: reportReason.name,
      })
      .expectAppError(ERROR_CODE.IS_COMMENT_AUTHOR);
  });

  it('should return 404 because report reason does not exist', async () => {
    return await pactum
      .spec()
      .withBearerToken(userNotAuthor.token)
      .post(`/ue/comments/reply/${reply.id}/report`)
      .withBody({
        body: "it's offensive",
        reason: 'idontexist',
      })
      .expectAppError(ERROR_CODE.NO_SUCH_REPORT_REASON);
  });

  it('should return a report', async () => {
    return await pactum
      .spec()
      .withBearerToken(userNotAuthor.token)
      .post(`/ue/comments/reply/${reply.id}/report`)
      .withBody({
        body: "it's offensive",
        reason: reportReason.name,
      })
      .expectUeCommentReport({
        id: JsonLike.UUID,
        body: "it's offensive",
        reason: reportReason.name,
        createdAt: JsonLike.DATE,
        reportedBody: reply.body,
        mitigated: false,
        user: {
          id: userNotAuthor.id,
          firstName: userNotAuthor.firstName,
          lastName: userNotAuthor.lastName,
        },
      });
  });
});

export default ReportCommentReply;
