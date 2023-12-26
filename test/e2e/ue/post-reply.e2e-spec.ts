import { HttpStatus } from '@nestjs/common';
import {
  createUser,
  suite,
  createUE,
  makeUserJoinUE,
  createComment,
} from '../../test_utils';
import * as pactum from 'pactum';
import { ERROR_CODE } from '../../../src/exceptions';

const PostCommmentReply = suite(
  'POST /ue/comments/{commentId}/reply',
  (app) => {
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
        .expectStatus(HttpStatus.UNAUTHORIZED);
    });

    it('should return a 400 because body is required', () => {
      return pactum
        .spec()
        .withBearerToken(user.token)
        .post(`/ue/comments/${comment.id}/reply`)
        .expectStatus(HttpStatus.BAD_REQUEST);
    });

    it('should return a 400 because body is a string', () => {
      return pactum
        .spec()
        .withBearerToken(user.token)
        .post(`/ue/comments/${comment.id}/reply`)
        .withBody({
          body: 13,
        })
        .expectStatus(HttpStatus.BAD_REQUEST);
    });

    it('should return a 400 because body is too short', () => {
      return pactum
        .spec()
        .withBearerToken(user.token)
        .post(`/ue/comments/${comment.id}/reply`)
        .withBody({
          body: 'gg',
        })
        .expectStatus(HttpStatus.BAD_REQUEST);
    });

    it('should return a 404 because comment does not exist', () => {
      return pactum
        .spec()
        .withBearerToken(user.token)
        .post(`/ue/comments/00000000-0000-0000-0000-000000000000/reply`)
        .withBody({
          body: 'heyhey',
        })
        .expectStatus(HttpStatus.NOT_FOUND)
        .expectJson({
          errorCode: ERROR_CODE.NO_SUCH_COMMENT,
          error: 'This comment does not exist',
        });
    });

    it('should return a 400 because comment does not exist', () => {
      return pactum
        .spec()
        .withBearerToken(user.token)
        .post(`/ue/comments/${comment.id.slice(0, 31)}/reply`)
        .withBody({
          body: 'heyhey',
        })
        .expectStatus(HttpStatus.BAD_REQUEST);
    });

    it('should return the posted comment', () => {
      return pactum
        .spec()
        .withBearerToken(user.token)
        .post(`/ue/comments/${comment.id}/reply`)
        .withBody({
          body: 'heyhey',
        })
        .expectStatus(HttpStatus.CREATED)
        .expectJsonLike({
          id: /[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}/,
          author: {
            id: user.id,
            lastName: user.lastName,
            firstName: user.firstName,
            studentId: user.studentId,
          },
          body: 'heyhey',
          createdAt: "typeof $V === 'string'",
          updatedAt: "typeof $V === 'string'",
        });
    });
  },
);

export default PostCommmentReply;
