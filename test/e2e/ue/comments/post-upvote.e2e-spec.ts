import {
  createUser,
  createUe,
  createComment,
  createCommentUpvote,
  createBranchOption,
  createBranch,
  createSemester,
} from '../../../utils/fakedb';
import * as pactum from 'pactum';
import { ERROR_CODE } from '../../../../src/exceptions';
import { HttpStatus } from '@nestjs/common';
import { Dummies, e2eSuite } from '../../../utils/test_utils';
import { PrismaService } from '../../../../src/prisma/prisma.service';

const PostUpvote = e2eSuite('POST /ue/comments/{commentId}/upvote', (app) => {
  const user = createUser(app);
  const user2 = createUser(app, { login: 'user2' });
  const semester = createSemester(app);
  const branch = createBranch(app);
  const branchOption = createBranchOption(app, { branch });
  const ue = createUe(app, { openSemesters: [semester], branchOption: [branchOption] });
  const comment = createComment(app, { ue, user, semester });

  it('should return a 401 as user is not authenticated', () => {
    return pactum.spec().post(`/ue/comments/${comment.id}/upvote`).expectAppError(ERROR_CODE.NOT_LOGGED_IN);
  });

  it('should return a 403 because user is the author', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .post(`/ue/comments/${comment.id}/upvote`)
      .expectAppError(ERROR_CODE.IS_COMMENT_AUTHOR);
  });

  it('should return a 400 because uuid is not an uuid', () => {
    return pactum
      .spec()
      .withBearerToken(user2.token)
      .post(`/ue/comments/${comment.id.slice(0, 31)}/upvote`)
      .expectAppError(ERROR_CODE.PARAM_NOT_UUID, 'commentId');
  });

  it('should return a 404 because reply does not exist', () => {
    return pactum
      .spec()
      .withBearerToken(user2.token)
      .post(`/ue/comments/${Dummies.UUID}/upvote`)
      .expectAppError(ERROR_CODE.NO_SUCH_COMMENT);
  });

  it('should create the upvote', async () => {
    await pactum
      .spec()
      .withBearerToken(user2.token)
      .post(`/ue/comments/${comment.id}/upvote`)
      .expectStatus(HttpStatus.OK)
      .expectJsonMatchStrict({ upvoted: true });
    return app().get(PrismaService).ueCommentUpvote.deleteMany();
  });

  it('should not be able to re-upvote upvote', async () => {
    await createCommentUpvote(app, { user: user2, comment }, {}, true);
    await pactum
      .spec()
      .withBearerToken(user2.token)
      .post(`/ue/comments/${comment.id}/upvote`)
      .expectAppError(ERROR_CODE.FORBIDDEN_ALREADY_UPVOTED);
    return app().get(PrismaService).ueCommentUpvote.deleteMany();
  });
});

export default PostUpvote;
