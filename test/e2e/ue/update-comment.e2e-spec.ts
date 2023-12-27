import { HttpStatus } from '@nestjs/common';
import {
  createUser,
  suite,
  createUE,
  createComment,
  JsonLike,
} from '../../test_utils';
import * as pactum from 'pactum';
import { ERROR_CODE } from '../../../src/exceptions';

const UpdateComment = suite('PATCH /ue/comments/{commentId}', (app) => {
  const user = createUser(app);
  const user2 = createUser(app, { login: 'user2' });
  const ue = createUE(app);
  const comment1 = createComment(app, ue, user);

  it('should return a 401 as user is not authenticated', () => {
    return pactum
      .spec()
      .patch(`/ue/comments/${comment1.id}`)
      .withBody({
        body: 'Test comment',
      })
      .expectStatus(HttpStatus.UNAUTHORIZED);
  });

  it('should return a 400 because body is a string', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .patch(`/ue/comments/${comment1.id}`)
      .withBody({
        body: false,
        isAnonymous: true,
      })
      .expectStatus(HttpStatus.BAD_REQUEST);
  });

  it('should return a 403 because user is not the author', () => {
    return pactum
      .spec()
      .withBearerToken(user2.token)
      .patch(`/ue/comments/${comment1.id}`)
      .withBody({
        body: 'Cette  UE est troooop bien',
        isAnonymous: true,
      })
      .expectStatus(HttpStatus.FORBIDDEN)
      .expectJson({
        errorCode: ERROR_CODE.NOT_COMMENT_AUTHOR,
        error: 'You are not the author of this comment',
      });
  });

  it('should return a 400 because body is too short', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .patch(`/ue/comments/${comment1.id}`)
      .withBody({
        body: 'gg',
      })
      .expectStatus(HttpStatus.BAD_REQUEST);
  });

  it('should return a 400 because uuid is not an uuid', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .patch(`/ue/comments/${comment1.id.slice(0, 31)}`)
      .withBody({
        body: 'heyhey',
      })
      .expectStatus(HttpStatus.BAD_REQUEST);
  });

  it('should return a 404 because comment does not exist', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .patch(`/ue/comments/00000000-0000-0000-0000-000000000000`)
      .withBody({
        body: 'heyhey',
      })
      .expectStatus(HttpStatus.NOT_FOUND)
      .expectJson({
        errorCode: ERROR_CODE.NO_SUCH_COMMENT,
        error: 'This comment does not exist',
      });
  });

  it('should return the updated comment as anonymous user', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .patch(`/ue/comments/${comment1.id}`)
      .withBody({
        body: 'Cette  UE est troooop bien',
        isAnonymous: true,
      })
      .expectStatus(HttpStatus.OK)
      .expectJsonLike({
        id: JsonLike.ANY_UUID,
        author: {
          firstName: 'user',
          lastName: 'user',
          studentId: 2,
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
      });
  });

  it('should return a post a comment as a logged in user', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .patch(`/ue/comments/${comment1.id}`)
      .withBody({
        isAnonymous: false,
      })
      .expectStatus(HttpStatus.OK)
      .expectJsonLike({
        id: JsonLike.ANY_UUID,
        author: {
          firstName: 'user',
          lastName: 'user',
          studentId: 2,
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
      });
  });
});

export default UpdateComment;
