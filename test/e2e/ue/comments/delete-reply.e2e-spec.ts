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
import { e2eSuite, Dummies } from '../../../utils/test_utils';
import * as pactum from 'pactum';
import { ERROR_CODE } from '../../../../src/exceptions';
import { CommentStatus } from 'src/ue/comments/interfaces/comment.interface';
import { PrismaService } from '../../../../src/prisma/prisma.service';

const DeleteCommentReply = e2eSuite('DELETE /ue/comments/reply/{replyId}', (app) => {
  const user = createUser(app, { permissions: ['API_GIVE_OPINIONS_UE'] });
  const userNotAuthor = createUser(app, { login: 'user2', permissions: ['API_GIVE_OPINIONS_UE'] });
  const userNoPermission = createUser(app);
  const semester = createSemester(app);
  const branch = createBranch(app);
  const branchOption = createBranchOption(app, { branch });
  const ue = createUe(app);
  const ueof = createUeof(app, { branchOptions: [branchOption], semesters: [semester], ue });
  const comment1 = createComment(app, { user, ueof, semester });
  const reply = createCommentReply(app, { user, comment: comment1 });

  it('should return a 401 as user is not authenticated', () => {
    return pactum.spec().delete(`/ue/comments/reply/${reply.id}`).expectAppError(ERROR_CODE.NOT_LOGGED_IN);
  });

  it('should fail as the user does not have the required permissions', () =>
    pactum
      .spec()
      .withBearerToken(userNoPermission.token)
      .delete(`/ue/comments/reply/${reply.id}`)
      .withBody({
        ueCode: ue.code,
        body: false,
        isAnonymous: true,
      })
      .expectAppError(ERROR_CODE.FORBIDDEN_NOT_ENOUGH_API_PERMISSIONS, 'API_GIVE_OPINIONS_UE'));

  it('should return a 403 because user is not the author', () => {
    return pactum
      .spec()
      .withBearerToken(userNotAuthor.token)
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

  it('should return the deleted reply', async () => {
    await pactum
      .spec()
      .withBearerToken(user.token)
      .delete(`/ue/comments/reply/${reply.id}`)
      .expectUeCommentReply({
        id: reply.id,
        author: {
          id: reply.authorId,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        createdAt: reply.createdAt.toISOString(),
        updatedAt: reply.updatedAt.toISOString(),
        body: reply.body,
        status: CommentStatus.DELETED | CommentStatus.VALIDATED,
      });
    await app()
      .get(PrismaService)
      .ueCommentReply.delete({
        where: { id: reply.id },
      });
    return createCommentReply(app, { user, comment: comment1 }, reply, true);
  });
});

export default DeleteCommentReply;
