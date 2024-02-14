import * as pactum from 'pactum';
import { createComment, createUE, createUser, upvoteComment } from '../../utils/fakedb';
import { e2eSuite } from '../../utils/test_utils';
import { UEComment } from '../../../src/ue/interfaces/comment.interface';
import { UEService } from '../../../src/ue/ue.service';
import { UECommentReply } from '../../../src/ue/interfaces/comment-reply.interface';
import { ERROR_CODE } from 'src/exceptions';
import { faker } from '@faker-js/faker';
import { omit } from '../../../src/utils';

const GetCommentFromIdE2ESpec = e2eSuite('GET /ue/comments/:commentId', (app) => {
  const user = createUser(app);
  const user2 = createUser(app, { login: 'user2', studentId: 3 });
  const ue = createUE(app, {
    code: `XX01`,
    semester: 'A24',
  });
  const comment = createComment(app, ue, user, true) as UEComment;
  upvoteComment(app, user2, comment);

  beforeAll(async () => {
    comment.answers.push(
      (await app().get(UEService).replyComment(user.id, comment.id, {
        body: 'HelloWorld',
      })) as UECommentReply,
    );
  });

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

  it('should return the comment with the author field as the user is the author', () => pactum
      .spec()
      .withBearerToken(user.token)
      .get(`/ue/comments/${comment.id}`)
      .expectUEComment({
        ...comment,
        answers: comment.answers.map((answer) => ({
          ...answer,
          createdAt: `${(<Date>answer.createdAt).toISOString()}`,
          updatedAt: `${(<Date>answer.updatedAt).toISOString()}`,
        })),
        updatedAt: `${(<Date>comment.updatedAt).toISOString()}`,
        createdAt: `${(<Date>comment.createdAt).toISOString()}`,
      }));

  it('should return the comment without the author field as the user is not the author', () => {
    return pactum
      .spec()
      .withBearerToken(user2.token)
      .get(`/ue/comments/${comment.id}`)
      .expectUEComment({
        ...omit(comment, 'author'),
        upvoted: true,
        answers: comment.answers.map((answer) => ({
          ...answer,
          createdAt: `${(<Date>answer.createdAt).toISOString()}`,
          updatedAt: `${(<Date>answer.updatedAt).toISOString()}`,
        })),
        updatedAt: `${(<Date>comment.updatedAt).toISOString()}`,
        createdAt: `${(<Date>comment.createdAt).toISOString()}`,
      });
  });
});

export default GetCommentFromIdE2ESpec;
