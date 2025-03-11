import * as pactum from 'pactum';
import {
  FakeComment,
  createBranch,
  createBranchOption,
  createComment,
  createCommentReply,
  createCommentUpvote,
  createSemester,
  createUe,
  createUeof,
  createUser,
} from '../../../utils/fakedb';
import { e2eSuite } from '../../../utils/test_utils';
import { ConfigModule } from '../../../../src/config/config.module';
import { ERROR_CODE } from 'src/exceptions';
import { PrismaService } from '../../../../src/prisma/prisma.service';

const GetCommentsE2ESpec = e2eSuite('GET /ue/comments', (app) => {
  const user = createUser(app);
  const user2 = createUser(app, { login: 'user2', studentId: 3 });
  const moderator = createUser(app, { login: 'user3', studentId: 3, permissions: ['commentModerator'] });
  const semester = createSemester(app);
  const branch = createBranch(app);
  const branchOption = createBranchOption(app, { branch });
  const ue = createUe(app);
  const ueof = createUeof(app, { branchOptions: [branchOption], semesters: [semester], ue });
  const comments: FakeComment[] = [];
  comments.push(
    createComment(
      app,
      { ueof, user, semester },
      {
        isAnonymous: true,
      },
    ),
  );
  createCommentUpvote(app, { user: user2, comment: comments[0] });
  createCommentReply(app, { user, comment: comments[0] });
  for (let i = 1; i < 30; i++) {
    const commentAuthor = createUser(app, {
      login: `user${i + 10}`,
      studentId: i + 10,
    });
    comments.push(
      createComment(
        app,
        { ueof, user: commentAuthor, semester },
        {
          isAnonymous: i % 2 === 0,
        },
      ),
    );
  }

  it('should return a 401 as user is not authenticated', () => {
    return pactum.spec().get(`/ue/comments`).expectAppError(ERROR_CODE.NOT_LOGGED_IN);
  });

  it('should return a 400 as user uses a wrong page', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get(`/ue/comments`)
      .withQueryParams({
        page: -1,
        ueCode: ue.code,
      })
      .expectAppError(ERROR_CODE.PARAM_NOT_POSITIVE, 'page');
  });

  it('should return a 404 because UE does not exist', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get(`/ue/comments`)
      .withQueryParams({
        ueCode: ue.code.slice(0, ue.code.length - 1),
      })
      .expectAppError(ERROR_CODE.NO_SUCH_UE, ue.code.slice(0, ue.code.length - 1));
  });

  it('should return the first page of comments', async () => {
    await app()
      .get(PrismaService)
      .ueComment.updateMany({
        data: {
          lastValidatedBody: 'I like to spread fake news in my comments !',
        },
      });
    const extendedComments = await app()
      .get(PrismaService)
      .ueComment.findMany(
        {
          args: {
            userId: user.id,
            includeDeletedReplied: false,
            includeLastValidatedBody: false,
          },
        },
        user.id,
      );
    const commentsFiltered = {
      items: extendedComments
        .sort((a, b) =>
          b.upvotes - a.upvotes == 0
            ? (<Date>b.createdAt).getTime() - (<Date>a.createdAt).getTime()
            : b.upvotes - a.upvotes,
        )
        .slice(0, app().get(ConfigModule).PAGINATION_PAGE_SIZE)
        .map((comment) => {
          if (comment.isAnonymous && comment.author.id !== user.id) delete comment.author;
          return { ...comment, ue };
        }),
      itemCount: comments.length,
      itemsPerPage: app().get(ConfigModule).PAGINATION_PAGE_SIZE,
    };
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get(`/ue/comments`)
      .withQueryParams({
        ueCode: ue.code,
      })
      .expectUeComments(commentsFiltered);
  });

  it('should return the second page of comments', async () => {
    const extendedComments = await app()
      .get(PrismaService)
      .ueComment.findMany(
        {
          args: {
            userId: user.id,
            includeDeletedReplied: false,
            includeLastValidatedBody: false,
          },
        },
        user.id,
      );
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get(`/ue/comments`)
      .withQueryParams({
        page: 2,
        ueCode: ue.code,
      })
      .expectUeComments({
        items: extendedComments
          .sort((a, b) =>
            b.upvotes - a.upvotes == 0
              ? (<Date>b.createdAt).getTime() - (<Date>a.createdAt).getTime()
              : b.upvotes - a.upvotes,
          )
          .slice(app().get(ConfigModule).PAGINATION_PAGE_SIZE, app().get(ConfigModule).PAGINATION_PAGE_SIZE * 2)
          .map((comment) => {
            if (comment.isAnonymous && comment.author.id !== user.id) delete comment.author;
            return { ...comment, ue };
          }),
        itemCount: comments.length,
        itemsPerPage: app().get(ConfigModule).PAGINATION_PAGE_SIZE,
      });
  });

  it('should return comments with lastValidatedBodies', async () => {
    await app()
      .get(PrismaService)
      .ueComment.updateMany({
        data: {
          lastValidatedBody: 'I like to spread fake news in my comments !',
        },
      });
    const extendedComments = await app()
      .get(PrismaService)
      .ueComment.findMany(
        {
          args: {
            userId: user.id,
            includeDeletedReplied: false,
            includeLastValidatedBody: true,
          },
        },
        user.id,
      );
    const commentsFiltered = {
      items: extendedComments
        .sort((a, b) =>
          b.upvotes - a.upvotes == 0
            ? (<Date>b.createdAt).getTime() - (<Date>a.createdAt).getTime()
            : b.upvotes - a.upvotes,
        )
        .map((comment) => ({ ...comment, ue }))
        .slice(0, app().get(ConfigModule).PAGINATION_PAGE_SIZE),
      itemCount: comments.length,
      itemsPerPage: app().get(ConfigModule).PAGINATION_PAGE_SIZE,
    };
    return pactum
      .spec()
      .withBearerToken(moderator.token)
      .get(`/ue/comments`)
      .withQueryParams({
        ueCode: ue.code,
      })
      .expectUeComments(commentsFiltered);
  });
});

export default GetCommentsE2ESpec;
