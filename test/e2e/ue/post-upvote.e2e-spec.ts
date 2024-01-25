import { createUser, createUE, createComment } from '../../utils/fakedb';
import * as pactum from 'pactum';
import { ERROR_CODE } from '../../../src/exceptions';
import { HttpStatus } from '@nestjs/common';
import { Dummies, e2eSuite } from '../../utils/test_utils';

const PostUpvote = e2eSuite('POST /ue/comments/{commentId}/upvote', (app) => {
  const user = createUser(app);
  const user2 = createUser(app, { login: 'user2' });
  const ue = createUE(app);
  const comment1 = createComment(app, ue, user);

  it('should return a 401 as user is not authenticated', () => {
    return pactum.spec().post(`/ue/comments/${comment1.id}/upvote`).expectAppError(ERROR_CODE.NOT_LOGGED_IN);
  });

  it('should return a 403 because user is the author', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .post(`/ue/comments/${comment1.id}/upvote`)
      .expectAppError(ERROR_CODE.IS_COMMENT_AUTHOR);
  });

  it('should return a 400 because uuid is not an uuid', () => {
    return pactum
      .spec()
      .withBearerToken(user2.token)
      .post(`/ue/comments/${comment1.id.slice(0, 31)}/upvote`)
      .expectAppError(ERROR_CODE.PARAM_NOT_UUID, 'commentId');
  });

  it('should return a 404 because reply does not exist', () => {
    return pactum
      .spec()
      .withBearerToken(user2.token)
      .post(`/ue/comments/${Dummies.UUID}/upvote`)
      .expectAppError(ERROR_CODE.NO_SUCH_COMMENT);
  });

  it('should create the upvote', () => {
    return pactum
      .spec()
      .withBearerToken(user2.token)
      .post(`/ue/comments/${comment1.id}/upvote`)
      .expectStatus(HttpStatus.CREATED);
  });

  it('should not be able to re-upvote upvote', () => {
    return pactum
      .spec()
      .withBearerToken(user2.token)
      .post(`/ue/comments/${comment1.id}/upvote`)
      .expectAppError(ERROR_CODE.FORBIDDEN_ALREADY_UPVOTED);
  });
});

export default PostUpvote;
