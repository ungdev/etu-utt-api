import {
  createUser,
  suite,
  createUE,
  makeUserJoinUE,
  JsonLike,
} from '../../test_utils';
import * as pactum from 'pactum';
import { ERROR_CODE } from '../../../src/exceptions';

const PostCommment = suite('POST /ue/{ueCode}/comments', (app) => {
  const user = createUser(app);
  const user2 = createUser(app, { login: 'user2' });
  const user3 = createUser(app, { login: 'user3' });
  const ue = createUE(app);
  makeUserJoinUE(app, user2, ue);
  makeUserJoinUE(app, user3, ue);

  it('should return a 401 as user is not authenticated', () => {
    return pactum
      .spec()
      .post('/ue/XX00/comments')
      .withBody({
        body: 'Test comment',
      })
      .expectAppError(ERROR_CODE.NOT_LOGGED_IN);
  });

  it('should return a 400 because body is a string', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .post('/ue/XX00/comments')
      .withBody({
        body: false,
        isAnonymous: true,
      })
      .expectAppError(ERROR_CODE.MALFORMED_PARAM, 'body');
  });

  it('should return a 403 because user has not done the UE yet', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .post('/ue/XX00/comments')
      .withBody({
        body: 'Cette  UE est troooop bien',
        isAnonymous: true,
      })
      .expectAppError(ERROR_CODE.NOT_ALREADY_DONE_UE);
  });

  it('should return a post a comment in the UE as anonymous user', () => {
    return pactum
      .spec()
      .withBearerToken(user2.token)
      .post('/ue/XX00/comments')
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
            code: 'A24',
          },
          isAnonymous: true,
          body: 'Cette  UE est troooop bien',
          answers: [],
          upvotes: 0,
          upvoted: false,
        },
        true,
      );
  });

  it('should return a 403 while trying to post another comment', () => {
    return pactum
      .spec()
      .withBearerToken(user2.token)
      .post('/ue/XX00/comments')
      .withBody({
        body: 'Cette  UE est troooop bien',
      })
      .expectAppError(ERROR_CODE.FORBIDDEN_ALREADY_COMMENTED);
  });

  it('should return a post a comment in the UE as a logged in user', () => {
    return pactum
      .spec()
      .withBearerToken(user3.token)
      .post('/ue/XX00/comments')
      .withBody({
        body: 'Cette  UE est troooop bien',
      })
      .expectUEComment(
        {
          id: JsonLike.ANY_UUID,
          author: {
            id: user3.id,
            firstName: user3.firstName,
            lastName: user3.lastName,
            studentId: user3.studentId,
          },
          createdAt: JsonLike.ANY_DATE,
          updatedAt: JsonLike.ANY_DATE,
          semester: {
            code: 'A24',
          },
          isAnonymous: false,
          body: 'Cette  UE est troooop bien',
          answers: [],
          upvotes: 0,
          upvoted: false,
        },
        true,
      );
  });

  it('should return a 400 because body is too short', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .post('/ue/XX00/comments')
      .withBody({
        body: 'gg',
      })
      .expectAppError(ERROR_CODE.MALFORMED_PARAM, 'body');
  });

  it('should return a 404 because UE does not exist', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .post(`/ue/${ue.code.slice(0, 3)}/comments`)
      .withBody({
        body: 'heyhey',
      })
      .expectAppError(ERROR_CODE.NO_SUCH_UE, ue.code.slice(0, 3));
  });
});

export default PostCommment;
