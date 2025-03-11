import * as pactum from 'pactum';
import * as fakedb from '../../../utils/fakedb';
import { e2eSuite } from '../../../utils/test_utils';
import { ERROR_CODE } from 'src/exceptions';
import { faker } from '@faker-js/faker';
import { omit } from '../../../../src/utils';
import { FakeComment } from '../../../utils/fakedb';

const GetCommentFromIdE2ESpec = e2eSuite('GET /ue/comments/:commentId', (app) => {
  const user = fakedb.createUser(app);
  const user2 = fakedb.createUser(app, { login: 'user2' });
  const semester = fakedb.createSemester(app);
  const branch = fakedb.createBranch(app);
  const branchOption = fakedb.createBranchOption(app, { branch });
  const ue = fakedb.createUe(app);
  const ueof = fakedb.createUeof(app, { branchOptions: [branchOption], semesters: [semester], ue });
  const comment = fakedb.createComment(app, { user, ueof, semester });
  fakedb.createCommentUpvote(app, { user: user2, comment });
  const reply = fakedb.createCommentReply(app, { user, comment }, { body: 'HelloWorld' });

  it('should return a 401 as user is not authenticated', () => {
    return pactum.spec().get(`/ue/comments/${comment.id}`).expectAppError(ERROR_CODE.NOT_LOGGED_IN);
  });

  it('should return a 400 because comment id is not a valid uuid', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get(`/ue/comments/${faker.datatype.uuid().slice(0, -1)}`)
      .expectAppError(ERROR_CODE.PARAM_NOT_UUID, 'commentId');
  });

  it('should return a 404 because comment does not exist', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get(`/ue/comments/${faker.datatype.uuid()}`)
      .expectAppError(ERROR_CODE.NO_SUCH_COMMENT);
  });

  it('should return the comment with the author field as the user is the author', () =>
    pactum
      .spec()
      .withBearerToken(user.token)
      .get(`/ue/comments/${comment.id}`)
      .expectUeComment({
        ueof,
        ...(omit(
          comment,
          'semesterId',
          'authorId',
          'deletedAt',
          'validatedAt',
          'lastValidatedBody',
        ) as Required<FakeComment>),
        answers: [
          {
            ...omit(reply, 'authorId', 'deletedAt', 'commentId'),
            author: {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
            },
            createdAt: reply.createdAt.toISOString(),
            updatedAt: reply.updatedAt.toISOString(),
          },
        ],
        updatedAt: comment.updatedAt.toISOString(),
        createdAt: comment.createdAt.toISOString(),
        semester: semester.code,
        upvotes: 1,
        upvoted: false,
      }));

  it('should return the comment without the author field as the user is not the author', () => {
    return pactum
      .spec()
      .withBearerToken(user2.token)
      .get(`/ue/comments/${comment.id}`)
      .expectUeComment({
        ueof,
        ...(omit(
          comment,
          'semesterId',
          'authorId',
          'deletedAt',
          'validatedAt',
          'lastValidatedBody',
        ) as Required<FakeComment>),
        answers: [
          {
            ...omit(reply, 'authorId', 'deletedAt', 'commentId'),
            createdAt: reply.createdAt.toISOString(),
            updatedAt: reply.updatedAt.toISOString(),
          },
        ],
        updatedAt: comment.updatedAt.toISOString(),
        createdAt: comment.createdAt.toISOString(),
        semester: semester.code,
        upvotes: 1,
        upvoted: true,
      });
  });
});

export default GetCommentFromIdE2ESpec;
