import { createUser, createUE, createComment } from '../../utils/fakedb';
import * as pactum from 'pactum';
import { ERROR_CODE } from '../../../src/exceptions';
import { e2eSuite } from '../../utils/test_utils';

const PutUpvote = e2eSuite('PUT /ue/comments/{commentId}/upvote', (app) => {
  const user = createUser(app);
  const user2 = createUser(app);
  const ue = createUE(app);
  const comment1 = createComment(app, ue, user);

  it('should return a 401 as user is not authenticated', () => {
    return pactum.spec().put(`/ue/comments/${comment1.id}/upvote`).expectAppError(ERROR_CODE.NOT_LOGGED_IN);
  });

  it('should return a 403 because user is the author', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .put(`/ue/comments/${comment1.id}/upvote`)
      .expectAppError(ERROR_CODE.IS_COMMENT_AUTHOR);
  });

  it('should return a 400 because uuid is not an uuid', () => {
    return pactum
      .spec()
      .withBearerToken(user2.token)
      .put(`/ue/comments/${comment1.id.slice(0, 31)}/upvote`)
      .expectAppError(ERROR_CODE.NOT_AN_UUID);
  });

  it('should return a 404 because reply does not exist', () => {
    return pactum
      .spec()
      .withBearerToken(user2.token)
      .put(`/ue/comments/00000000-0000-0000-0000-000000000000/upvote`)
      .expectAppError(ERROR_CODE.NO_SUCH_COMMENT);
  });

  it('should return the upvoted upvote', () => {
    return pactum
      .spec()
      .withBearerToken(user2.token)
      .put(`/ue/comments/${comment1.id}/upvote`)
      .expectUECommentUpvote({ upvoted: true });
  });

  it('should return the de-upvote upvote', () => {
    return pactum
      .spec()
      .withBearerToken(user2.token)
      .put(`/ue/comments/${comment1.id}/upvote`)
      .expectUECommentUpvote({ upvoted: false });
  });
});

export default PutUpvote;
