import {
  createUser,
  createUE,
  createComment,
  createBranch,
  createBranchOption,
  createSemester,
  createCommentUpvote,
} from '../../../utils/fakedb';
import * as pactum from 'pactum';
import { ERROR_CODE } from '../../../../src/exceptions';
import { HttpStatus } from '@nestjs/common';
import { Dummies, e2eSuite } from '../../../utils/test_utils';
import { PrismaService } from '../../../../src/prisma/prisma.service';

const DeleteUpvote = e2eSuite('DELETE /ue/comments/{commentId}/upvote', (app) => {
  const user = createUser(app);
  const user2 = createUser(app, { login: 'user2' });
  const semester = createSemester(app);
  const branch = createBranch(app);
  const branchOption = createBranchOption(app, { branch });
  const ue = createUE(app, { openSemesters: [semester], branchOption: [branchOption] });
  const comment1 = createComment(app, { user, ue, semester });
  const upvote = createCommentUpvote(app, { user: user2, comment: comment1 });

  it('should return a 401 as user is not authenticated', () => {
    return pactum.spec().delete(`/ue/comments/${comment1.id}/upvote`).expectAppError(ERROR_CODE.NOT_LOGGED_IN);
  });

  it('should return a 403 because user is the author', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .delete(`/ue/comments/${comment1.id}/upvote`)
      .expectAppError(ERROR_CODE.IS_COMMENT_AUTHOR);
  });

  it('should return a 400 because uuid is not an uuid', () => {
    return pactum
      .spec()
      .withBearerToken(user2.token)
      .delete(`/ue/comments/${comment1.id.slice(0, 31)}/upvote`)
      .expectAppError(ERROR_CODE.PARAM_NOT_UUID, 'commentId');
  });

  it('should return a 404 because reply does not exist', () => {
    return pactum
      .spec()
      .withBearerToken(user2.token)
      .delete(`/ue/comments/${Dummies.UUID}/upvote`)
      .expectAppError(ERROR_CODE.NO_SUCH_COMMENT);
  });

  it('should delete the upvote', async () => {
    await pactum
      .spec()
      .withBearerToken(user2.token)
      .delete(`/ue/comments/${comment1.id}/upvote`)
      .expectStatus(HttpStatus.OK)
      .expectJson({ upvoted: false });
    return createCommentUpvote(app, { user: user2, comment: comment1 }, upvote, true);
  });

  it('should not be able to re-de-upvote a comment', async () => {
    await app()
      .get(PrismaService)
      .uECommentUpvote.delete({ where: { id: upvote.id } });
    await pactum
      .spec()
      .withBearerToken(user2.token)
      .delete(`/ue/comments/${comment1.id}/upvote`)
      .expectAppError(ERROR_CODE.FORBIDDEN_ALREADY_UNUPVOTED);
    return createCommentUpvote(app, { user: user2, comment: comment1 }, upvote, true);
  });
});

export default DeleteUpvote;
