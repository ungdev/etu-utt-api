import { HttpStatus } from '@nestjs/common';
import { createUser, suite, createUE, createComment } from '../../test_utils';
import * as pactum from 'pactum';
import { ERROR_CODE } from '../../../src/exceptions';

const DeleteComment = suite('DELETE /ue/comments/{commentId}', (app) => {
  const user = createUser(app);
  const user2 = createUser(app, { login: 'user2' });
  const ue = createUE(app);
  const comment1 = createComment(app, ue, user);

  it('should return a 401 as user is not authenticated', () => {
    return pactum
      .spec()
      .delete(`/ue/comments/${comment1.id}`)
      .expectStatus(HttpStatus.UNAUTHORIZED);
  });

  it('should return a 403 because user is not the author', () => {
    return pactum
      .spec()
      .withBearerToken(user2.token)
      .delete(`/ue/comments/${comment1.id}`)
      .expectStatus(HttpStatus.FORBIDDEN)
      .expectJson({
        errorCode: ERROR_CODE.NOT_COMMENT_AUTHOR,
        error: 'You are not the author of this comment',
      });
  });

  it('should return a 400 because uuid is not an uuid', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .delete(`/ue/comments/${comment1.id.slice(0, 31)}`)
      .expectStatus(HttpStatus.BAD_REQUEST);
  });

  it('should return a 404 because comment does not exist', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .delete(`/ue/comments/00000000-0000-0000-0000-000000000000`)
      .expectStatus(HttpStatus.NOT_FOUND)
      .expectJson({
        errorCode: ERROR_CODE.NO_SUCH_COMMENT,
        error: 'This comment does not exist',
      });
  });

  it('should return the deleted comment', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .delete(`/ue/comments/${comment1.id}`)
      .expectStatus(HttpStatus.OK)
      .expectJsonLike({
        id: "typeof $V === 'string'",
        author: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          studentId: user.studentId,
        },
        createdAt: "typeof $V === 'string'",
        updatedAt: "typeof $V === 'string'",
        semester: {
          code: 'A24',
        },
        isAnonymous: false,
        body: 'TEST',
        answers: [],
        upvotes: 0,
        upvoted: false,
      });
  });
});

export default DeleteComment;
