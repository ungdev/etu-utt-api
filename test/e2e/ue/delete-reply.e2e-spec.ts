import { createUser, createUE, createComment, createReply } from '../../utils/fakedb';
import { JsonLike, e2eSuite, Dummies } from '../../utils/test_utils';
import * as pactum from 'pactum';
import { ERROR_CODE } from '../../../src/exceptions';

const DeleteCommentReply = e2eSuite('DELETE /ue/comments/reply/{replyId}', (app) => {
  const user = createUser(app);
  const user2 = createUser(app, { login: 'user2' });
  const ue = createUE(app);
  const comment1 = createComment(app, ue, user);
  const reply = createReply(app, user, comment1);

  it('should return a 401 as user is not authenticated', () => {
    return pactum.spec().delete(`/ue/comments/reply/${reply.id}`).expectAppError(ERROR_CODE.NOT_LOGGED_IN);
  });

  it('should return a 403 because user is not the author', () => {
    return pactum
      .spec()
      .withBearerToken(user2.token)
      .delete(`/ue/comments/reply/${reply.id}`)
      .expectAppError(ERROR_CODE.NOT_REPLY_AUTHOR);
  });

  it('should return a 400 because uuid is not an uuid', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .delete(`/ue/comments/reply/${comment1.id.slice(0, 31)}`)
      .expectAppError(ERROR_CODE.PARAM_NOT_UUID, 'replyId');
  });

  it('should return a 404 because reply does not exist', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .delete(`/ue/comments/reply/${Dummies.UUID}`)
      .expectAppError(ERROR_CODE.NO_SUCH_REPLY);
  });

  it('should return the deleted comment', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .delete(`/ue/comments/reply/${reply.id}`)
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
        body: "Bouboubou je suis pas d'accord",
      });
  });
});

export default DeleteCommentReply;