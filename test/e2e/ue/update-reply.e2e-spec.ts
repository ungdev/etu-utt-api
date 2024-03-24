import {
  createUser,
  createUE,
  createComment,
  createBranch,
  createBranchOption,
  createSemester,
  createCommentReply,
} from '../../utils/fakedb';
import * as pactum from 'pactum';
import { ERROR_CODE } from '../../../src/exceptions';
import { Dummies, e2eSuite, JsonLike } from '../../utils/test_utils';
import { PrismaService } from '../../../src/prisma/prisma.service';

const UpdateCommentReply = e2eSuite('PATCH /ue/comments/reply/{replyId}', (app) => {
  const user = createUser(app);
  const user2 = createUser(app, { login: 'user2' });
  const semester = createSemester(app);
  const branch = createBranch(app);
  const branchOption = createBranchOption(app, { branch });
  const ue = createUE(app, { semesters: [semester], branchOption });
  const comment = createComment(app, { ue, user, semester });
  const reply = createCommentReply(app, { user, comment });

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
      .expectAppError(ERROR_CODE.PARAM_NOT_STRING, 'body');
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
      .expectAppError(ERROR_CODE.PARAM_TOO_SHORT, 'body');
  });

  it('should return a 400 because uuid is not an uuid', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .patch(`/ue/comments/reply/${reply.id.slice(0, 31)}`)
      .withBody({
        body: 'heyhey',
      })
      .expectAppError(ERROR_CODE.PARAM_NOT_UUID, 'replyId');
  });

  it('should return a 404 because reply does not exist', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .patch(`/ue/comments/reply/${Dummies.UUID}`)
      .withBody({
        body: 'heyhey',
      })
      .expectAppError(ERROR_CODE.NO_SUCH_REPLY);
  });

  it('should return the updated comment', async () => {
    await pactum
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
    return app().get(PrismaService).uECommentReply.deleteMany();
  });
});

export default UpdateCommentReply;
