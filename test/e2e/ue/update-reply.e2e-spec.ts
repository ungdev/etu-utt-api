import { HttpStatus } from '@nestjs/common';
import {
  createUser,
  suite,
  createUE,
  createComment,
  createReply,
} from '../../test_utils';
import * as pactum from 'pactum';
import { ERROR_CODE } from '../../../src/exceptions';

const UpdateCommentReply = suite(
  'PATCH /ue/comments/reply/{replyId}',
  (app) => {
    const user = createUser(app);
    const user2 = createUser(app, { login: 'user2' });
    const ue = createUE(app);
    const comment1 = createComment(app, ue, user);
    const reply = createReply(app, user, comment1);

    it('should return a 401 as user is not authenticated', () => {
      return pactum
        .spec()
        .patch(`/ue/comments/reply/${reply.id}`)
        .withBody({
          body: 'Test comment',
        })
        .expectStatus(HttpStatus.UNAUTHORIZED);
    });

    it('should return a 400 because body is a string', () => {
      return pactum
        .spec()
        .withBearerToken(user.token)
        .patch(`/ue/comments/reply/${reply.id}`)
        .withBody({
          body: false,
        })
        .expectStatus(HttpStatus.BAD_REQUEST);
    });

    it('should return a 403 because user is not the author', () => {
      return pactum
        .spec()
        .withBearerToken(user2.token)
        .patch(`/ue/comments/reply/${reply.id}`)
        .withBody({
          body: "Je m'appelle Alban Ichou et j'approuve ce commentaire",
        })
        .expectStatus(HttpStatus.FORBIDDEN)
        .expectJson({
          errorCode: ERROR_CODE.NOT_REPLY_AUTHOR,
          error: 'You are not the author of this reply',
        });
    });

    it('should return a 400 because body is too short', () => {
      return pactum
        .spec()
        .withBearerToken(user.token)
        .patch(`/ue/comments/reply/${reply.id}`)
        .withBody({
          body: 'gg',
        })
        .expectStatus(HttpStatus.BAD_REQUEST);
    });

    it('should return a 404 because reply does not exist', () => {
      return pactum
        .spec()
        .withBearerToken(user.token)
        .patch(`/ue/comments/reply/${reply.id.slice(0, 10)}`)
        .withBody({
          body: 'heyhey',
        })
        .expectStatus(HttpStatus.NOT_FOUND)
        .expectJson({
          errorCode: ERROR_CODE.NO_SUCH_REPLY,
          error: 'This reply does not exist',
        });
    });

    it('should return the updated comment', () => {
      return pactum
        .spec()
        .withBearerToken(user.token)
        .patch(`/ue/comments/reply/${reply.id}`)
        .withBody({
          body: "Je m'appelle Alban Ichou et j'approuve ce commentaire",
        })
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
          body: "Je m'appelle Alban Ichou et j'approuve ce commentaire",
        });
    });
  },
);

export default UpdateCommentReply;
