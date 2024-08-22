import {
  createUser,
  createUe,
  createComment,
  createBranch,
  createBranchOption,
  createSemester,
  createUeSubscription,
} from '../../../utils/fakedb';
import * as pactum from 'pactum';
import { ERROR_CODE } from '../../../../src/exceptions';
import { Dummies, e2eSuite, JsonLike } from '../../../utils/test_utils';
import { PrismaService } from '../../../../src/prisma/prisma.service';
import { CommentStatus } from 'src/ue/comments/interfaces/comment.interface';

const PostCommmentReply = e2eSuite('POST /ue/comments/{commentId}/reply', (app) => {
  const user = createUser(app);
  const semester = createSemester(app);
  const branch = createBranch(app);
  const branchOption = createBranchOption(app, { branch });
  const ue = createUe(app, { openSemesters: [semester], branchOption: [branchOption] });
  const comment = createComment(app, { ue, user, semester });
  createUeSubscription(app, { user, ue, semester });

  it('should return a 401 as user is not authenticated', () => {
    return pactum
      .spec()
      .post(`/ue/comments/${comment.id}/reply`)
      .withBody({
        body: 'Test comment',
      })
      .expectAppError(ERROR_CODE.NOT_LOGGED_IN);
  });

  it('should return a 400 because body is required', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .post(`/ue/comments/${comment.id}/reply`)
      .expectAppError(ERROR_CODE.PARAM_MISSING, 'body');
  });

  it('should return a 400 because body is not a string', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .post(`/ue/comments/${comment.id}/reply`)
      .withBody({
        body: 13,
      })
      .expectAppError(ERROR_CODE.PARAM_NOT_STRING, 'body');
  });

  it('should return a 400 because body is too short', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .post(`/ue/comments/${comment.id}/reply`)
      .withBody({
        body: 'gg',
      })
      .expectAppError(ERROR_CODE.PARAM_TOO_SHORT, 'body');
  });

  it('should return a 404 because comment does not exist', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .post(`/ue/comments/${Dummies.UUID}/reply`)
      .withBody({
        body: 'heyhey',
      })
      .expectAppError(ERROR_CODE.NO_SUCH_COMMENT);
  });

  it('should return a 400 because comment id is invalid', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .post(`/ue/comments/${comment.id.slice(0, 31)}/reply`)
      .withBody({
        body: 'heyhey',
      })
      .expectAppError(ERROR_CODE.PARAM_NOT_UUID, 'commentId');
  });

  it('should return the posted reply', async () => {
    await pactum
      .spec()
      .withBearerToken(user.token)
      .post(`/ue/comments/${comment.id}/reply`)
      .withBody({
        body: 'heyhey',
      })
      .expectUeCommentReply(
        {
          id: JsonLike.ANY_UUID,
          author: {
            id: user.id,
            lastName: user.lastName,
            firstName: user.firstName,
            studentId: user.studentId,
          },
          body: 'heyhey',
          createdAt: JsonLike.ANY_DATE,
          updatedAt: JsonLike.ANY_DATE,
          status: CommentStatus.VALIDATED,
        },
        true,
      );
    return app().get(PrismaService).ueCommentReply.deleteMany();
  });
});

export default PostCommmentReply;
