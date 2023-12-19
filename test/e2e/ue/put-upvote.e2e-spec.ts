import { HttpStatus } from '@nestjs/common';
import { createUser, suite, createUE, createComment } from '../../test_utils';
import * as pactum from 'pactum';
import { UEUnComputedDetail } from '../../../src/ue/interfaces/ue-detail.interface';
import { ERROR_CODE } from '../../../src/exceptions';
import { UEComment } from '../../../src/ue/interfaces/comment.interface';

const PutUpvote = suite('PUT /ue/comments/{commentId}/upvote', (app) => {
  const user = createUser(app);
  const user2 = createUser(app, { login: 'user2' });
  let ue: UEUnComputedDetail;
  let comment1: UEComment;

  beforeAll(async () => {
    ue = (await createUE(app)) as UEUnComputedDetail;
    comment1 = await createComment(app, ue.code, user);
  });

  it('should return a 401 as user is not authenticated', () => {
    return pactum
      .spec()
      .put(`/ue/comments/${comment1.id}/upvote`)
      .expectStatus(HttpStatus.UNAUTHORIZED);
  });

  it('should return a 403 because user is the author', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .put(`/ue/comments/${comment1.id}/upvote`)
      .expectStatus(HttpStatus.FORBIDDEN)
      .expectJson({
        errorCode: ERROR_CODE.IS_COMMENT_AUTHOR,
        error: 'You are the author of this comment',
      });
  });

  it('should return a 404 because reply does not exist', () => {
    return pactum
      .spec()
      .withBearerToken(user2.token)
      .put(`/ue/comments/${comment1.id.slice(0, 10)}/upvote`)
      .expectStatus(HttpStatus.NOT_FOUND)
      .expectJson({
        errorCode: ERROR_CODE.NO_SUCH_COMMENT,
        error: 'This comment does not exist',
      });
  });

  it('should return the upvoted upvote', () => {
    return pactum
      .spec()
      .withBearerToken(user2.token)
      .put(`/ue/comments/${comment1.id}/upvote`)
      .expectStatus(HttpStatus.OK)
      .expectJsonLike({ upvoted: true });
  });

  it('should return the de-upvote upvote', () => {
    return pactum
      .spec()
      .withBearerToken(user2.token)
      .put(`/ue/comments/${comment1.id}/upvote`)
      .expectStatus(HttpStatus.OK)
      .expectJsonLike({ upvoted: false });
  });
});

export default PutUpvote;
