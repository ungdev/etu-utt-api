import { HttpStatus } from '@nestjs/common';
import { createUser, suite, createUE, makeUserJoinUE } from '../../test_utils';
import * as pactum from 'pactum';
import { UEUnComputedDetail } from '../../../src/ue/interfaces/ue-detail.interface';
import { ERROR_CODE } from '../../../src/exceptions';

const PostCommment = suite('POST /ue/{ueCode}/comments', (app) => {
  const user = createUser(app);
  const user2 = createUser(app, { login: 'user2' });
  const user3 = createUser(app, { login: 'user3' });
  let ue: UEUnComputedDetail;

  beforeAll(async () => {
    ue = (await createUE(app)) as UEUnComputedDetail;
    await makeUserJoinUE(app, user2.id, ue.code);
    await makeUserJoinUE(app, user3.id, ue.code);
  });

  it('should return a 401 as user is not authenticated', () => {
    return pactum
      .spec()
      .post('/ue/XX00/comments')
      .withBody({
        body: 'Test comment',
      })
      .expectStatus(HttpStatus.UNAUTHORIZED);
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
      .expectStatus(HttpStatus.BAD_REQUEST);
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
      .expectStatus(HttpStatus.FORBIDDEN)
      .expectJson({
        errorCode: ERROR_CODE.NOT_ALREADY_DONE_UE,
        error: 'You must have done this UE before to perform this action',
      });
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
      .expectStatus(HttpStatus.CREATED)
      .expectJsonLike({
        id: "typeof $V === 'string'",
        author: {
          firstName: 'user',
          lastName: 'user',
          studentId: 2,
        },
        createdAt: "typeof $V === 'string'",
        updatedAt: "typeof $V === 'string'",
        semester: {
          code: 'A24',
        },
        isAnonymous: true,
        body: 'Cette  UE est troooop bien',
        answers: [],
        upvotes: 0,
        upvoted: false,
      });
  });

  it('should return a 403 while trying to post another comment', () => {
    return pactum
      .spec()
      .withBearerToken(user2.token)
      .post('/ue/XX00/comments')
      .withBody({
        body: 'Cette  UE est troooop bien',
      })
      .expectStatus(HttpStatus.FORBIDDEN)
      .expectJson({
        errorCode: ERROR_CODE.FORBIDDEN_ALREADY_COMMENTED,
        error: 'You have already posted a comment for this UE',
      });
  });

  it('should return a post a comment in the UE as a logged in user', () => {
    return pactum
      .spec()
      .withBearerToken(user3.token)
      .post('/ue/XX00/comments')
      .withBody({
        body: 'Cette  UE est troooop bien',
      })
      .expectStatus(HttpStatus.CREATED)
      .expectJsonLike({
        id: "typeof $V === 'string'",
        author: {
          firstName: 'user',
          lastName: 'user',
          studentId: 2,
        },
        createdAt: "typeof $V === 'string'",
        updatedAt: "typeof $V === 'string'",
        semester: {
          code: 'A24',
        },
        isAnonymous: false,
        body: 'Cette  UE est troooop bien',
        answers: [],
        upvotes: 0,
        upvoted: false,
      });
  });

  it('should return a 400 because body is too short', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .post('/ue/XX00/comments')
      .withBody({
        body: 'gg',
      })
      .expectStatus(HttpStatus.BAD_REQUEST);
  });

  it('should return a 404 because UE does not exist', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .post(`/ue/${ue.code.slice(0, 3)}/comments`)
      .withBody({
        body: 'heyhey',
      })
      .expectStatus(HttpStatus.NOT_FOUND)
      .expectJson({
        errorCode: ERROR_CODE.NO_SUCH_UE,
        error: 'The UE XX0 does not exist',
      });
  });
});

export default PostCommment;
