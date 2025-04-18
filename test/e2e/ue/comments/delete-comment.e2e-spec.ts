import {
  createUser,
  createUe,
  createComment,
  createSemester,
  createBranchOption,
  createBranch,
  createCommentUpvote,
  createUeof,
} from '../../../utils/fakedb';
import { Dummies, e2eSuite } from '../../../utils/test_utils';
import * as pactum from 'pactum';
import { ERROR_CODE } from '../../../../src/exceptions';
import { CommentStatus } from 'src/ue/comments/interfaces/comment.interface';
import { PrismaService } from '../../../../src/prisma/prisma.service';

const DeleteComment = e2eSuite('DELETE /ue/comments/:commentId', (app) => {
  const user = createUser(app);
  const user2 = createUser(app, { login: 'user2' });
  const semester = createSemester(app);
  const branch = createBranch(app);
  const branchOption = createBranchOption(app, { branch });
  const ue = createUe(app);
  const ueof = createUeof(app, { branchOptions: [branchOption], semesters: [semester], ue });
  const comment1 = createComment(app, { user, ueof, semester });
  createCommentUpvote(app, { user, comment: comment1 });

  it('should return a 401 as user is not authenticated', () => {
    return pactum.spec().delete(`/ue/comments/${comment1.id}`).expectAppError(ERROR_CODE.NOT_LOGGED_IN);
  });

  it('should return a 403 because user is not the author', () => {
    return pactum
      .spec()
      .withBearerToken(user2.token)
      .delete(`/ue/comments/${comment1.id}`)
      .expectAppError(ERROR_CODE.NOT_COMMENT_AUTHOR);
  });

  it('should return a 400 because uuid is not an uuid', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .delete(`/ue/comments/${comment1.id.slice(0, 31)}`)
      .expectAppError(ERROR_CODE.PARAM_NOT_UUID, 'commentId');
  });

  it('should return a 404 because comment does not exist', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .delete(`/ue/comments/${Dummies.UUID}`)
      .expectAppError(ERROR_CODE.NO_SUCH_COMMENT);
  });

  it('should return the deleted comment', async () => {
    await pactum
      .spec()
      .withBearerToken(user.token)
      .delete(`/ue/comments/${comment1.id}`)
      .expectUeComment({
        ueof,
        id: comment1.id,
        author: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        createdAt: comment1.createdAt.toISOString(),
        updatedAt: comment1.updatedAt.toISOString(),
        semester: semester.code,
        isAnonymous: comment1.isAnonymous,
        body: comment1.body,
        answers: [],
        upvotes: 1,
        upvoted: true,
        status: CommentStatus.DELETED | CommentStatus.VALIDATED,
      });
    await app()
      .get(PrismaService)
      .normalize.ueComment.delete({
        args: {
          includeDeletedReplied: false,
          includeLastValidatedBody: false,
          userId: user.id,
        },
        where: { id: comment1.id },
      });
    return createComment(app, { user, ueof, semester }, comment1, true);
  });
});

export default DeleteComment;
