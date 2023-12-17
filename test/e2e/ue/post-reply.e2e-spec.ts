import { HttpStatus } from '@nestjs/common';
import { createUser, suite, createUE, makeUserJoinUE } from '../../test_utils';
import * as pactum from 'pactum';
import { UEUnComputedDetail } from '../../../src/ue/interfaces/ue-detail.interface';
import { ERROR_CODE } from '../../../src/exceptions';
import { UEService } from '../../../src/ue/ue.service';
import { UEComment } from '../../../src/ue/interfaces/comment.interface';

const PostCommmentReply = suite('Post Comment Reply', (app) => {
  const user = createUser(app);
  let comment: UEComment;

  beforeAll(async () => {
    const ue = (await createUE(app)) as UEUnComputedDetail;
    await makeUserJoinUE(app, user.id, ue.code);
    comment = await app().get(UEService).createComment(
      {
        body: 'Cette UE est incroyable',
      },
      user,
      ue.code,
    );
  });

  it('should return a 401 as user is not authenticated', () => {
    return pactum
      .spec()
      .post(`/ue/comments/${comment.id}/reply`)
      .withBody({
        body: 'Test comment',
      })
      .expectStatus(HttpStatus.UNAUTHORIZED);
  });

  it('should return a 400 because body is required', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .post(`/ue/comments/${comment.id}/reply`)
      .expectStatus(HttpStatus.BAD_REQUEST);
  });

  it('should return a 400 because body is a string', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .post(`/ue/comments/${comment.id}/reply`)
      .withBody({
        body: 13,
      })
      .expectStatus(HttpStatus.BAD_REQUEST);
  });

  it('should return a 400 because body is too short', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .post(`/ue/comments/${comment.id}/reply`)
      .withBody({
        body: 'gg',
      })
      .expectStatus(HttpStatus.BAD_REQUEST);
  });

  it('should return a 404 because comment does not exist', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .post(`/ue/comments/${comment.id.slice(0, 10)}/reply`)
      .withBody({
        body: 'heyhey',
      })
      .expectStatus(HttpStatus.NOT_FOUND)
      .expectJson({
        errorCode: ERROR_CODE.NO_SUCH_COMMENT,
        error: 'This comment does not exist',
      });
  });
});

export default PostCommmentReply;
