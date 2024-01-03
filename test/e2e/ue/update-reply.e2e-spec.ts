import {
  createUser,
  suite,
  createUE,
  createComment,
  createReply,
  JsonLike,
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
        .expectAppError(ERROR_CODE.NOT_LOGGED_IN);
    });

    it('should return a 400 because body is a string', () => {
      return pactum
        .spec()
        .withBearerToken(user.token)
        .patch(`/ue/comments/reply/${reply.id}`)
        .withBody({
          body: false,
        })
        .expectAppError(ERROR_CODE.MALFORMED_PARAM, 'body');
    });

    it('should return a 403 because user is not the author', () => {
      return pactum
        .spec()
        .withBearerToken(user2.token)
        .patch(`/ue/comments/reply/${reply.id}`)
        .withBody({
          body: "Je m'appelle Alban Ichou et j'approuve ce commentaire",
        })
        .expectAppError(ERROR_CODE.NOT_REPLY_AUTHOR);
    });

    it('should return a 400 because body is too short', () => {
      return pactum
        .spec()
        .withBearerToken(user.token)
        .patch(`/ue/comments/reply/${reply.id}`)
        .withBody({
          body: 'gg',
        })
        .expectAppError(ERROR_CODE.MALFORMED_PARAM, 'body');
    });

    it('should return a 400 because uuid is not an uuid', () => {
      return pactum
        .spec()
        .withBearerToken(user.token)
        .patch(`/ue/comments/reply/${reply.id.slice(0, 31)}`)
        .withBody({
          body: 'heyhey',
        })
        .expectAppError(ERROR_CODE.NOT_AN_UUID);
    });

    it('should return a 404 because reply does not exist', () => {
      return pactum
        .spec()
        .withBearerToken(user.token)
        .patch(`/ue/comments/reply/00000000-0000-0000-0000-000000000000`)
        .withBody({
          body: 'heyhey',
        })
        .expectAppError(ERROR_CODE.NO_SUCH_REPLY);
    });

    it('should return the updated comment', () => {
      return pactum
        .spec()
        .withBearerToken(user.token)
        .patch(`/ue/comments/reply/${reply.id}`)
        .withBody({
          body: "Je m'appelle Alban Ichou et j'approuve ce commentaire",
        })
        .expectUECommentReply({
          id: JsonLike.ANY_UUID,
          author: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            studentId: user.studentId,
          },
          createdAt: JsonLike.ANY_DATE,
          updatedAt: JsonLike.ANY_DATE,
          body: "Je m'appelle Alban Ichou et j'approuve ce commentaire",
        });
    });
  },
);

export default UpdateCommentReply;
