import {
  createUser,
  suite,
  createUE,
  createComment,
  JsonLike,
} from '../../test_utils';
import * as pactum from 'pactum';
import { ERROR_CODE } from '../../../src/exceptions';

const UpdateComment = suite('PATCH /ue/comments/{commentId}', (app) => {
  const user = createUser(app);
  const user2 = createUser(app, { login: 'user2' });
  const ue = createUE(app);
  const comment1 = createComment(app, ue, user);

  it('should return a 401 as user is not authenticated', () => {
    return pactum
      .spec()
      .patch(`/ue/comments/${comment1.id}`)
      .withBody({
        body: 'Test comment',
      })
      .expectAppError(ERROR_CODE.NOT_LOGGED_IN);
  });

  it('should return a 400 because body is a string', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .patch(`/ue/comments/${comment1.id}`)
      .withBody({
        body: false,
        isAnonymous: true,
      })
      .expectAppError(ERROR_CODE.PARAM_NOT_STRING, 'body');
  });

  it('should return a 403 because user is not the author', () => {
    return pactum
      .spec()
      .withBearerToken(user2.token)
      .patch(`/ue/comments/${comment1.id}`)
      .withBody({
        body: 'Cette  UE est troooop bien',
        isAnonymous: true,
      })
      .expectAppError(ERROR_CODE.NOT_COMMENT_AUTHOR);
  });

  it('should return a 400 because body is too short', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .patch(`/ue/comments/${comment1.id}`)
      .withBody({
        body: 'gg',
      })
      .expectAppError(ERROR_CODE.PARAM_TOO_SHORT, 'body');
  });

  it('should return a 400 because uuid is not an uuid', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .patch(`/ue/comments/${comment1.id.slice(0, 31)}`)
      .withBody({
        body: 'heyhey',
      })
      .expectAppError(ERROR_CODE.NOT_AN_UUID);
  });

  it('should return a 404 because comment does not exist', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .patch(`/ue/comments/00000000-0000-0000-0000-000000000000`)
      .withBody({
        body: 'heyhey',
      })
      .expectAppError(ERROR_CODE.NO_SUCH_COMMENT);
  });

  it('should return the updated comment as anonymous user', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .patch(`/ue/comments/${comment1.id}`)
      .withBody({
        body: 'Cette  UE est troooop bien',
        isAnonymous: true,
      })
      .expectUEComment({
        id: JsonLike.ANY_UUID,
        author: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          studentId: user.studentId,
        },
        createdAt: JsonLike.ANY_DATE,
        updatedAt: JsonLike.ANY_DATE,
        semester: {
          code: 'A24',
        },
        isAnonymous: true,
        body: 'Cette  UE est troooop bien',
        answers: [],
        upvotes: 0,
        upvoted: false,
      });
  });

  it('should return a post a comment as a logged in user', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .patch(`/ue/comments/${comment1.id}`)
      .withBody({
        isAnonymous: false,
      })
      .expectUEComment({
        id: JsonLike.ANY_UUID,
        author: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          studentId: user.studentId,
        },
        createdAt: JsonLike.ANY_DATE,
        updatedAt: JsonLike.ANY_DATE,
        semester: {
          code: 'A24',
        },
        isAnonymous: false,
        body: 'Cette  UE est troooop bien',
        answers: [],
        upvotes: 0,
        upvoted: false,
      });
  });
});

export default UpdateComment;
