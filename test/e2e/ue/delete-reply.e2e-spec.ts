import {
  createUser,
  createUE,
  createComment,
  createBranch,
  createBranchOption,
  createSemester,
  createCommentReply,
} from '../../utils/fakedb';
import { e2eSuite, Dummies } from '../../utils/test_utils';
import * as pactum from 'pactum';
import { ERROR_CODE } from '../../../src/exceptions';

const DeleteCommentReply = e2eSuite('DELETE /ue/comments/reply/{replyId}', (app) => {
  const user = createUser(app);
  const user2 = createUser(app, { login: 'user2' });
  const semester = createSemester(app);
  const branch = createBranch(app);
  const branchOption = createBranchOption(app, { branch });
  const ue = createUE(app, { semesters: [semester], branchOption });
  const comment1 = createComment(app, { user, ue, semester });
  const reply = createCommentReply(app, { user, comment: comment1 });

  it('should return a 401 as user is not authenticated', () => {
    return pactum.spec().delete(`/ue/comments/reply/${reply.id}`).expectAppError(ERROR_CODE.NOT_LOGGED_IN);
  });

  it('should return a 403 because user is not the author', () => {
    return pactum
      .spec()
      .withBearerToken(user2.token)
      .delete(`/ue/comments/reply/${reply.id}`)
      .expectAppError(ERROR_CODE.NOT_REPLY_AUTHOR);
  });

  it('should return a 400 because uuid is not an uuid', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .delete(`/ue/comments/reply/${comment1.id.slice(0, 31)}`)
      .expectAppError(ERROR_CODE.PARAM_NOT_UUID, 'replyId');
  });

  it('should return a 404 because reply does not exist', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .delete(`/ue/comments/reply/${Dummies.UUID}`)
      .expectAppError(ERROR_CODE.NO_SUCH_REPLY);
  });

  it('should return the deleted reply', async () => {
    await pactum
      .spec()
      .withBearerToken(user.token)
      .delete(`/ue/comments/reply/${reply.id}`)
      .expectUECommentReply({
        id: reply.id,
        author: {
          id: reply.authorId,
          firstName: user.firstName,
          lastName: user.lastName,
          studentId: user.studentId,
        },
        createdAt: reply.createdAt.toISOString(),
        updatedAt: reply.updatedAt.toISOString(),
        body: reply.body,
      });
    return createCommentReply(app, { user, comment: comment1 }, reply, true);
  });
});

export default DeleteCommentReply;
