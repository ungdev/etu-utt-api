import {
  createUser,
  createUe,
  createComment,
  createCommentUpvote,
  createBranchOption,
  createBranch,
  createSemester,
  createUeof,
} from '../../../utils/fakedb';
import * as pactum from 'pactum';
import { ERROR_CODE } from '../../../../src/exceptions';
import { HttpStatus } from '@nestjs/common';
import { Dummies, e2eSuite } from '../../../utils/test_utils';
import { PrismaService } from '../../../../src/prisma/prisma.service';

const PostUpvote = e2eSuite('POST /ue/comments/{commentId}/upvote', (app) => {
  const user = createUser(app, { permissions: ['API_GIVE_OPINIONS_UE'] });
  const userNotAuthor = createUser(app, { login: 'user2', permissions: ['API_GIVE_OPINIONS_UE'] });
  const userNoPermission = createUser(app);
  const semester = createSemester(app);
  const branch = createBranch(app);
  const branchOption = createBranchOption(app, { branch });
  const ue = createUe(app);
  const ueof = createUeof(app, { branchOptions: [branchOption], semesters: [semester], ue });
  const comment = createComment(app, { ueof, user, semester });

  it('should return a 401 as user is not authenticated', () => {
    return pactum.spec().post(`/ue/comments/${comment.id}/upvote`).expectAppError(ERROR_CODE.NOT_LOGGED_IN);
  });

  it('should fail as the user does not have the required permissions', () =>
    pactum
      .spec()
      .withBearerToken(userNoPermission.token)
      .post(`/ue/comments/${comment.id}/upvote`)
      .withBody({
        ueCode: ue.code,
        body: false,
        isAnonymous: true,
      })
      .expectAppError(ERROR_CODE.FORBIDDEN_NOT_ENOUGH_API_PERMISSIONS, 'API_GIVE_OPINIONS_UE'));

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
      .withBearerToken(userNotAuthor.token)
      .post(`/ue/comments/${comment.id.slice(0, 31)}/upvote`)
      .expectAppError(ERROR_CODE.PARAM_NOT_UUID, 'commentId');
  });

  it('should return a 404 because reply does not exist', () => {
    return pactum
      .spec()
      .withBearerToken(userNotAuthor.token)
      .post(`/ue/comments/${Dummies.UUID}/upvote`)
      .expectAppError(ERROR_CODE.NO_SUCH_COMMENT);
  });

  it('should create the upvote', async () => {
    await pactum
      .spec()
      .withBearerToken(userNotAuthor.token)
      .post(`/ue/comments/${comment.id}/upvote`)
      .expectStatus(HttpStatus.OK)
      .expectJsonMatchStrict({ upvoted: true });
    return app().get(PrismaService).ueCommentUpvote.deleteMany();
  });

  it('should not be able to re-upvote upvote', async () => {
    await createCommentUpvote(app, { user: userNotAuthor, comment }, {}, true);
    await pactum
      .spec()
      .withBearerToken(userNotAuthor.token)
      .post(`/ue/comments/${comment.id}/upvote`)
      .expectAppError(ERROR_CODE.FORBIDDEN_ALREADY_UPVOTED);
    return app().get(PrismaService).ueCommentUpvote.deleteMany();
  });
});

export default PostUpvote;
