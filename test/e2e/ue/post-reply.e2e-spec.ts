import { createUser, createUE, makeUserJoinUE, createComment } from '../../utils/fakedb';
import * as pactum from 'pactum';
import { ERROR_CODE } from '../../../src/exceptions';
import { e2eSuite, JsonLike } from '../../utils/test_utils';

const PostCommmentReply = e2eSuite('POST /ue/comments/{commentId}/reply', (app) => {
  const user = createUser(app);
  const ue = createUE(app);
  makeUserJoinUE(app, user, ue);
  const comment = createComment(app, ue, user, false);

  it('should return a 401 as user is not authenticated', () => {
    return pactum
      .spec()
      .post(`/ue/comments/${comment.id}/reply`)
      .withBody({
        body: 'Test comment',
      })
      .expectAppError(ERROR_CODE.NOT_LOGGED_IN);
  });

  it('should return a 400 because body is required', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .post(`/ue/comments/${comment.id}/reply`)
      .expectAppError(ERROR_CODE.PARAM_MISSING, 'body');
  });

  it('should return a 400 because body is a string', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .post(`/ue/comments/${comment.id}/reply`)
      .withBody({
        body: 13,
      })
      .expectAppError(ERROR_CODE.PARAM_NOT_STRING, 'body');
  });

  it('should return a 400 because body is too short', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .post(`/ue/comments/${comment.id}/reply`)
      .withBody({
        body: 'gg',
      })
      .expectAppError(ERROR_CODE.PARAM_TOO_SHORT, 'body');
  });

  it('should return a 404 because comment does not exist', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .post(`/ue/comments/00000000-0000-0000-0000-000000000000/reply`)
      .withBody({
        body: 'heyhey',
      })
      .expectAppError(ERROR_CODE.NO_SUCH_COMMENT);
  });

  it('should return a 400 because comment id is invalid', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .post(`/ue/comments/${comment.id.slice(0, 31)}/reply`)
      .withBody({
        body: 'heyhey',
      })
      .expectAppError(ERROR_CODE.NOT_AN_UUID);
  });

  it('should return the posted comment', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .post(`/ue/comments/${comment.id}/reply`)
      .withBody({
        body: 'heyhey',
      })
      .expectUECommentReply(
        {
          id: JsonLike.ANY_UUID,
          author: {
            id: user.id,
            lastName: user.lastName,
            firstName: user.firstName,
            studentId: user.studentId,
          },
          body: 'heyhey',
          createdAt: JsonLike.ANY_DATE,
          updatedAt: JsonLike.ANY_DATE,
        },
        true,
      );
  });
});

export default PostCommmentReply;
