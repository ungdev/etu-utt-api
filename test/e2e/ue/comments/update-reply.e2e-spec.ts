import {
  createUser,
  createUe,
  createComment,
  createBranch,
  createBranchOption,
  createSemester,
  createCommentReply,
  createUeof,
} from '../../../utils/fakedb';
import * as pactum from 'pactum';
import { ERROR_CODE } from '../../../../src/exceptions';
import { Dummies, e2eSuite, JsonLike } from '../../../utils/test_utils';
import { PrismaService } from '../../../../src/prisma/prisma.service';
import { CommentStatus } from 'src/ue/comments/interfaces/comment.interface';

const UpdateCommentReply = e2eSuite('PATCH /ue/comments/reply/{replyId}', (app) => {
  const user = createUser(app, { permissions: ['API_GIVE_OPINIONS_UE'] });
  const userNotAuthor = createUser(app, { login: 'user2', permissions: ['API_GIVE_OPINIONS_UE'] });
  const userNoPermission = createUser(app);
  const semester = createSemester(app);
  const branch = createBranch(app);
  const branchOption = createBranchOption(app, { branch });
  const ue = createUe(app);
  const ueof = createUeof(app, { branchOptions: [branchOption], semesters: [semester], ue });
  const comment = createComment(app, { ueof, user, semester });
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

  it('should fail as the user does not have the required permissions', () =>
    pactum
      .spec()
      .withBearerToken(userNoPermission.token)
      .patch(`/ue/comments/reply/${reply.id}`)
      .withBody({
        ueCode: ue.code,
        body: false,
        isAnonymous: true,
      })
      .expectAppError(ERROR_CODE.FORBIDDEN_NOT_ENOUGH_API_PERMISSIONS, 'API_GIVE_OPINIONS_UE'));

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
      .withBearerToken(userNotAuthor.token)
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
      .expectUeCommentReply({
        id: JsonLike.ANY_UUID,
        author: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        createdAt: JsonLike.ANY_DATE,
        updatedAt: JsonLike.ANY_DATE,
        body: "Je m'appelle Alban Ichou et j'approuve ce commentaire",
        status: CommentStatus.VALIDATED,
      });
    return app().get(PrismaService).ueCommentReply.deleteMany();
  });
});

export default UpdateCommentReply;
