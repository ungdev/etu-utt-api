import * as pactum from 'pactum';
import { createComment, createUE, createUser, suite } from '../../test_utils';
import { ConfigService } from '@nestjs/config';
import { UEComment } from '../../../src/ue/interfaces/comment.interface';
import { UEService } from '../../../src/ue/ue.service';
import { UECommentReply } from '../../../src/ue/interfaces/comment-reply.interface';
import { ERROR_CODE } from 'src/exceptions';

// TODO : tester les upvotes et les answers

const GetCommentsE2ESpec = suite('GET /ue/{ueCode}/comments', (app) => {
  const user = createUser(app);
  const user2 = createUser(app, { login: 'user2', studentId: 3 });
  const ue = createUE(app, {
    code: `XX01`,
    semester: 'A24',
  });
  const comments: UEComment[] = [];
  for (let i = 0; i < 30; i++)
    comments.push(createComment(app, ue, user, i % 2 === 0) as UEComment);

  beforeAll(async () => {
    comments[0].answers.push(
      (await app().get(UEService).replyComment(user, comments[0].id, {
        body: 'HelloWorld',
      })) as UECommentReply,
    );
  });

  it('should return a 401 as user is not authenticated', () => {
    return pactum
      .spec()
      .get(`/ue/${ue.inscriptionCode}/comments`)
      .expectAppError(ERROR_CODE.NOT_LOGGED_IN);
  });

  it('should return a 400 as user uses a wrong page', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get(`/ue/${ue.inscriptionCode}/comments`)
      .withQueryParams('page', -1)
      .expectAppError(ERROR_CODE.PARAM_NOT_POSITIVE, 'page');
  });

  it('should return a 404 because UE does not exist', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get(`/ue/${ue.inscriptionCode.slice(0, 3)}/comments`)
      .expectAppError(ERROR_CODE.NO_SUCH_UE, ue.code.slice(0, 3));
  });

  it('should return the first page of comments', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get(`/ue/${ue.inscriptionCode}/comments`)
      .expectUEComments({
        items: comments
          .sort((a, b) =>
            b.upvotes - a.upvotes == 0
              ? (<Date>b.createdAt).getTime() - (<Date>a.createdAt).getTime()
              : b.upvotes - a.upvotes,
          )
          .slice(
            0,
            Number(
              app().get(ConfigService).get<number>('PAGINATION_PAGE_SIZE'),
            ),
          )
          .map((comment) => ({
            ...comment,
            answers: comment.answers.map((answer) => ({
              ...answer,
              createdAt: `${(<Date>answer.createdAt).toISOString()}`,
              updatedAt: `${(<Date>answer.updatedAt).toISOString()}`,
            })),
            updatedAt: `${(<Date>comment.updatedAt).toISOString()}`,
            createdAt: `${(<Date>comment.createdAt).toISOString()}`,
          })),
        itemCount: comments.length,
        itemsPerPage: Number(
          app().get(ConfigService).get<number>('PAGINATION_PAGE_SIZE'),
        ),
      });
  });

  it('should return the second page of comments', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get(`/ue/${ue.inscriptionCode}/comments`)
      .withQueryParams('page', 2)
      .expectUEComments({
        items: comments
          .sort((a, b) =>
            b.upvotes - a.upvotes == 0
              ? (<Date>b.createdAt).getTime() - (<Date>a.createdAt).getTime()
              : b.upvotes - a.upvotes,
          )
          .slice(
            Number(
              app().get(ConfigService).get<number>('PAGINATION_PAGE_SIZE'),
            ),
            Number(
              app().get(ConfigService).get<number>('PAGINATION_PAGE_SIZE'),
            ) * 2,
          )
          .map((comment) => ({
            ...comment,
            answers: comment.answers.map((answer) => ({
              ...answer,
              createdAt: `${(<Date>answer.createdAt).toISOString()}`,
              updatedAt: `${(<Date>answer.updatedAt).toISOString()}`,
            })),
            updatedAt: `${(<Date>comment.updatedAt).toISOString()}`,
            createdAt: `${(<Date>comment.createdAt).toISOString()}`,
          })),
        itemCount: comments.length,
        itemsPerPage: Number(
          app().get(ConfigService).get<number>('PAGINATION_PAGE_SIZE'),
        ),
      });
  });

  it('should return the first page of comments with hidden anonymous authors', () => {
    return pactum
      .spec()
      .withBearerToken(user2.token)
      .get(`/ue/${ue.inscriptionCode}/comments`)
      .expectUEComments({
        items: comments
          .sort((a, b) =>
            b.upvotes - a.upvotes == 0
              ? (<Date>b.createdAt).getTime() - (<Date>a.createdAt).getTime()
              : b.upvotes - a.upvotes,
          )
          .slice(
            0,
            Number(
              app().get(ConfigService).get<number>('PAGINATION_PAGE_SIZE'),
            ),
          )
          .map((comment) => {
            if (comment.isAnonymous) delete comment.author;
            return {
              ...comment,
              answers: comment.answers.map((answer) => ({
                ...answer,
                createdAt: `${(<Date>answer.createdAt).toISOString()}`,
                updatedAt: `${(<Date>answer.updatedAt).toISOString()}`,
              })),
              updatedAt: `${(<Date>comment.updatedAt).toISOString()}`,
              createdAt: `${(<Date>comment.createdAt).toISOString()}`,
            };
          }),
        itemCount: comments.length,
        itemsPerPage: Number(
          app().get(ConfigService).get<number>('PAGINATION_PAGE_SIZE'),
        ),
      });
  });
});

export default GetCommentsE2ESpec;
