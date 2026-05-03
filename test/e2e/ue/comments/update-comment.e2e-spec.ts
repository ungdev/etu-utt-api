import {
  createBranch,
  createBranchOption,
  createComment,
  createCommentUpvote,
  createSemester,
  createUe,
  createUeof,
  createUser,
} from '#/utils/fakedb';
import * as pactum from 'pactum';
import { ERROR_CODE } from '@/exceptions';
import { Dummies, JsonLike, e2eSuite } from '#/utils/test_utils';
import { PrismaService } from '@/prisma/prisma.service';
import { CommentStatus } from '@/ue/comments/interfaces/comment.interface';
import { PermissionManager } from '@/utils';

const UpdateComment = e2eSuite('PATCH /ue/comments/:commentId', (app) => {
  const user = createUser(app, { permissions: new PermissionManager().with('API_GIVE_OPINIONS_UE') });
  const userNotCommentAuthor = createUser(app, {
    login: 'user2',
    permissions: new PermissionManager().with('API_GIVE_OPINIONS_UE'),
  });
  const userNoPermission = createUser(app);
  const semester = createSemester(app);
  const branch = createBranch(app);
  const branchOption = createBranchOption(app, { branch });
  const ue = createUe(app);
  const ueof = createUeof(app, { branchOptions: [branchOption], semesters: [semester], ue });
  const comment = createComment(app, { ueof, user, semester });
  createCommentUpvote(app, { user: userNotCommentAuthor, comment });

  it('should return a 401 as user is not authenticated', () => {
    return pactum
      .spec()
      .patch(`/ue/comments/${comment.id}`)
      .withBody({
        body: 'Test comment',
      })
      .expectAppError(ERROR_CODE.NOT_LOGGED_IN);
  });

  it('should fail as the user does not have the required permissions', () =>
    pactum
      .spec()
      .withBearerToken(userNoPermission.token)
      .patch(`/ue/comments/${comment.id}`)
      .withBody({
        body: 'Test comment',
      })
      .expectAppError(ERROR_CODE.FORBIDDEN_NOT_ENOUGH_API_PERMISSIONS, 'API_GIVE_OPINIONS_UE'));

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
      .withBearerToken(userNotCommentAuthor.token)
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
        id: JsonLike.UUID,
        author: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          studentId: user.studentId,
        },
        createdAt: JsonLike.DATE,
        updatedAt: JsonLike.DATE,
        semester: semester.code,
        isAnonymous: true,
        body: 'Cette  UE est troooop bien',
        answers: [],
        upvotes: 1,
        upvoted: false,
        status: CommentStatus.UNVERIFIED,
        lastValidatedBody: comment.body,
      });
    await app().get(PrismaService).ueComment.deleteMany();
    await createComment(app, { ueof, user, semester }, comment, true);
    return createCommentUpvote(app, { user: userNotCommentAuthor, comment }, {}, true);
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
        id: JsonLike.UUID,
        author: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          studentId: user.studentId,
        },
        createdAt: JsonLike.DATE,
        updatedAt: JsonLike.DATE,
        semester: semester.code,
        isAnonymous: false,
        body: comment.body,
        answers: [],
        upvotes: 1,
        upvoted: false,
        status: CommentStatus.VALIDATED,
        lastValidatedBody: null,
      });
    await app().get(PrismaService).ueComment.deleteMany();
    await createComment(app, { ueof, user, semester }, comment, true);
    return createCommentUpvote(app, { user: userNotCommentAuthor, comment }, {}, true);
  });
});

export default UpdateComment;
