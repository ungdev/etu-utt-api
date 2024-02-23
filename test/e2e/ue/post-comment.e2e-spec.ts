import {
  createUser,
  createUE,
  createBranch,
  createBranchOption,
  createSemester,
  createUESubscription,
  createComment,
} from '../../utils/fakedb';
import * as pactum from 'pactum';
import { ERROR_CODE } from '../../../src/exceptions';
import { e2eSuite, JsonLike } from '../../utils/test_utils';
import { PrismaService } from '../../../src/prisma/prisma.service';

const PostCommment = e2eSuite('POST /ue/{ueCode}/comments', (app) => {
  const user = createUser(app);
  const user2 = createUser(app, { login: 'user2' });
  const semester = createSemester(app);
  const branch = createBranch(app);
  const branchOption = createBranchOption(app, { branch });
  const ue = createUE(app, { semesters: [semester], branchOption });
  createUESubscription(app, { user: user2, ue, semester });

  it('should return a 401 as user is not authenticated', () => {
    return pactum
      .spec()
      .post(`/ue/${ue.code}/comments`)
      .withBody({
        body: 'Test comment',
      })
      .expectAppError(ERROR_CODE.NOT_LOGGED_IN);
  });

  it('should return a 400 because body is a not string', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .post(`/ue/${ue.code}/comments`)
      .withBody({
        body: false,
        isAnonymous: true,
      })
      .expectAppError(ERROR_CODE.PARAM_NOT_STRING, 'body');
  });

  it('should return a 400 because body is too short', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .post(`/ue/${ue.code}/comments`)
      .withBody({
        body: 'gg',
      })
      .expectAppError(ERROR_CODE.PARAM_TOO_SHORT, 'body');
  });

  it('should return a 404 because UE does not exist', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .post(`/ue/${ue.code.slice(0, ue.code.length - 1)}/comments`)
      .withBody({
        body: 'heyhey',
      })
      .expectAppError(ERROR_CODE.NO_SUCH_UE, ue.code.slice(0, ue.code.length - 1));
  });

  it('should return a 403 because user has not done the UE yet', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .post(`/ue/${ue.code}/comments`)
      .withBody({
        body: 'Cette  UE est troooop bien',
        isAnonymous: true,
      })
      .expectAppError(ERROR_CODE.NOT_ALREADY_DONE_UE);
  });

  it('should return a comment as anonymous user', async () => {
    await pactum
      .spec()
      .withBearerToken(user2.token)
      .post(`/ue/${ue.code}/comments`)
      .withBody({
        body: 'Cette  UE est troooop bien',
        isAnonymous: true,
      })
      .expectUEComment(
        {
          id: JsonLike.ANY_UUID,
          author: {
            id: user2.id,
            firstName: user2.firstName,
            lastName: user2.lastName,
            studentId: user2.studentId,
          },
          createdAt: JsonLike.ANY_DATE,
          updatedAt: JsonLike.ANY_DATE,
          semester: {
            code: semester.code,
          },
          isAnonymous: true,
          body: 'Cette  UE est troooop bien',
          answers: [],
          upvotes: 0,
          upvoted: false,
        },
        true,
      );
    return app().get(PrismaService).uEComment.deleteMany();
  });

  it('should return a 403 while trying to post another comment', async () => {
    await createComment(app, { ue, user: user2, semester }, { isAnonymous: true }, true);
    await pactum
      .spec()
      .withBearerToken(user2.token)
      .post(`/ue/${ue.code}/comments`)
      .withBody({
        body: 'Cette  UE est troooop bien',
      })
      .expectAppError(ERROR_CODE.FORBIDDEN_ALREADY_COMMENTED);
    return app().get(PrismaService).uEComment.deleteMany();
  });

  it('should return a comment as a logged in user', async () => {
    await pactum
      .spec()
      .withBearerToken(user2.token)
      .post(`/ue/${ue.code}/comments`)
      .withBody({
        body: 'Cette  UE est troooop bien',
      })
      .expectUEComment(
        {
          id: JsonLike.ANY_UUID,
          author: {
            id: user2.id,
            firstName: user2.firstName,
            lastName: user2.lastName,
            studentId: user2.studentId,
          },
          createdAt: JsonLike.ANY_DATE,
          updatedAt: JsonLike.ANY_DATE,
          semester: {
            code: semester.code,
          },
          isAnonymous: false,
          body: 'Cette  UE est troooop bien',
          answers: [],
          upvotes: 0,
          upvoted: false,
        },
        true,
      );
    return app().get(PrismaService).uEComment.deleteMany();
  });
});

export default PostCommment;
