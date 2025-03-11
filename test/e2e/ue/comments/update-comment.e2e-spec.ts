import {
  createUser,
  createUe,
  createComment,
  createBranch,
  createBranchOption,
  createSemester,
  createCommentUpvote,
  createUeof,
} from '../../../utils/fakedb';
import * as pactum from 'pactum';
import { ERROR_CODE } from '../../../../src/exceptions';
import { Dummies, e2eSuite, JsonLike } from '../../../utils/test_utils';
import { PrismaService } from '../../../../src/prisma/prisma.service';
import { CommentStatus } from 'src/ue/comments/interfaces/comment.interface';

const UpdateComment = e2eSuite('PATCH /ue/comments/:commentId', (app) => {
  const user = createUser(app);
  const user2 = createUser(app, { login: 'user2' });
  const semester = createSemester(app);
  const branch = createBranch(app);
  const branchOption = createBranchOption(app, { branch });
  const ue = createUe(app);
  const ueof = createUeof(app, { branchOptions: [branchOption], semesters: [semester], ue });
  const comment = createComment(app, { ueof, user, semester });
  createCommentUpvote(app, { user: user2, comment });

  it('should return a 401 as user is not authenticated', () => {
    return pactum
      .spec()
      .patch(`/ue/comments/${comment.id}`)
      .withBody({
        body: 'Test comment',
      })
      .expectAppError(ERROR_CODE.NOT_LOGGED_IN);
  });

  it('should return a 400 because body is a string', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .patch(`/ue/comments/${comment.id}`)
      .withBody({
        body: false,
        isAnonymous: true,
      })
      .expectAppError(ERROR_CODE.PARAM_NOT_STRING, 'body');
  });

  it('should return a 403 because user is not the author', () => {
    return pactum
      .spec()
      .withBearerToken(user2.token)
      .patch(`/ue/comments/${comment.id}`)
      .withBody({
        body: 'Cette  UE est troooop bien',
        isAnonymous: true,
      })
      .expectAppError(ERROR_CODE.NOT_COMMENT_AUTHOR);
  });

  it('should return a 400 because body is too short', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .patch(`/ue/comments/${comment.id}`)
      .withBody({
        body: 'gg',
      })
      .expectAppError(ERROR_CODE.PARAM_TOO_SHORT, 'body');
  });

  it('should return a 400 because uuid is not an uuid', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .patch(`/ue/comments/${comment.id.slice(0, 31)}`)
      .withBody({
        body: 'heyhey',
      })
      .expectAppError(ERROR_CODE.PARAM_NOT_UUID, 'commentId');
  });

  it('should return a 404 because comment does not exist', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .patch(`/ue/comments/${Dummies.UUID}`)
      .withBody({
        body: 'heyhey',
      })
      .expectAppError(ERROR_CODE.NO_SUCH_COMMENT);
  });

  it('should return the updated comment as anonymous user', async () => {
    await pactum
      .spec()
      .withBearerToken(user.token)
      .patch(`/ue/comments/${comment.id}`)
      .withBody({
        body: 'Cette  UE est troooop bien',
        isAnonymous: true,
      })
      .expectUeComment({
        ueof,
        id: JsonLike.ANY_UUID,
        author: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        createdAt: JsonLike.ANY_DATE,
        updatedAt: JsonLike.ANY_DATE,
        semester: semester.code,
        isAnonymous: true,
        body: 'Cette  UE est troooop bien',
        answers: [],
        upvotes: 1,
        upvoted: false,
        status: CommentStatus.UNVERIFIED,
      });
    await app().get(PrismaService).ueComment.deleteMany();
    await createComment(app, { ueof, user, semester }, comment, true);
    return createCommentUpvote(app, { user: user2, comment }, {}, true);
  });

  it('should return the updated comment as a logged in user', async () => {
    await pactum
      .spec()
      .withBearerToken(user.token)
      .patch(`/ue/comments/${comment.id}`)
      .withBody({
        isAnonymous: false,
      })
      .expectUeComment({
        ueof,
        id: JsonLike.ANY_UUID,
        author: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        createdAt: JsonLike.ANY_DATE,
        updatedAt: JsonLike.ANY_DATE,
        semester: semester.code,
        isAnonymous: false,
        body: comment.body,
        answers: [],
        upvotes: 1,
        upvoted: false,
        status: CommentStatus.VALIDATED,
      });
    await app().get(PrismaService).ueComment.deleteMany();
    await createComment(app, { ueof, user, semester }, comment, true);
    return createCommentUpvote(app, { user: user2, comment }, {}, true);
  });
});

export default UpdateComment;
