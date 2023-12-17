import { HttpStatus } from '@nestjs/common';
import * as pactum from 'pactum';
import { UEUnComputedDetail } from 'src/ue/interfaces/ue-detail.interface';
import { createComment, createUE, createUser, suite } from '../../test_utils';
import { ConfigService } from '@nestjs/config';
import { UEComment } from '../../../src/ue/interfaces/comment.interface';

const GetCommentsE2ESpec = suite('Get Comments', (app) => {
  const user = createUser(app);
  const comments: UEComment[] = [];
  let ue: UEUnComputedDetail;

  beforeAll(async () => {
    ue = (await createUE(app, {
      code: `XX01`,
      semester: 'A24',
    })) as UEUnComputedDetail;
    for (let i = 0; i < 30; i++)
      comments.push(await createComment(app, ue.code, user));
  });

  it('should return a 401 as user is not authenticated', () => {
    return pactum
      .spec()
      .get(`/ue/${ue.inscriptionCode}/comments`)
      .expectStatus(HttpStatus.UNAUTHORIZED);
  });

  it('should return the first page of comments', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get(`/ue/${ue.inscriptionCode}/comments`)
      .expectStatus(HttpStatus.OK)
      .expectJson({
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
      .expectStatus(HttpStatus.OK)
      .expectJson({
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
            updatedAt: `${(<Date>comment.updatedAt).toISOString()}`,
            createdAt: `${(<Date>comment.createdAt).toISOString()}`,
          })),
        itemCount: comments.length,
        itemsPerPage: Number(
          app().get(ConfigService).get<number>('PAGINATION_PAGE_SIZE'),
        ),
      });
  });
});

export default GetCommentsE2ESpec;
