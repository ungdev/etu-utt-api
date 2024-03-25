import * as pactum from 'pactum';
import {
  FakeComment,
  createBranch,
  createBranchOption,
  createComment,
  createCommentReply,
  createCommentUpvote,
  createSemester,
  createUE,
  createUser,
} from '../../utils/fakedb';
import { e2eSuite } from '../../utils/test_utils';
import { ConfigService } from '@nestjs/config';
import { ERROR_CODE } from 'src/exceptions';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { CommentStatus, SelectComment } from '../../../src/ue/interfaces/comment.interface';
import { omit } from '../../../src/utils';

const GetCommentsE2ESpec = e2eSuite('GET /ue/{ueCode}/comments', (app) => {
  const user = createUser(app);
  const user2 = createUser(app, { login: 'user2', studentId: 3 });
  const moderator = createUser(app, { login: 'user3', studentId: 3, permissions: ['commentModerator'] });
  const semester = createSemester(app);
  const branch = createBranch(app);
  const branchOption = createBranchOption(app, { branch });
  const ue = createUE(app, { semesters: [semester], branchOption });
  const comments: FakeComment[] = [];
  comments.push(
    createComment(
      app,
      { ue, user, semester },
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
        { ue, user: commentAuthor, semester },
        {
          isAnonymous: i % 2 === 0,
        },
      ),
    );
  }

  it('should return a 401 as user is not authenticated', () => {
    return pactum.spec().get(`/ue/${ue.code}/comments`).expectAppError(ERROR_CODE.NOT_LOGGED_IN);
  });

  it('should return a 400 as user uses a wrong page', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get(`/ue/${ue.code}/comments`)
      .withQueryParams('page', -1)
      .expectAppError(ERROR_CODE.PARAM_NOT_POSITIVE, 'page');
  });

  it('should return a 404 because UE does not exist', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get(`/ue/${ue.code.slice(0, ue.code.length - 1)}/comments`)
      .expectAppError(ERROR_CODE.NO_SUCH_UE, ue.code.slice(0, ue.code.length - 1));
  });

  it('should return the first page of comments', async () => {
    await app()
      .get(PrismaService)
      .uEComment.updateMany({
        data: {
          lastValidatedBody: 'I like to spread fake news in my comments !',
        },
      });
    const extendedComments = (
      await app()
        .get(PrismaService)
        .uEComment.findMany(
          SelectComment(
            {
              select: {
                upvotes: true,
              },
            },
            user.id,
            ue.code,
          ),
        )
    ).map((comment) => ({
      ...comment,
      upvotes: comment.upvotes.length,
      upvoted: comment.upvotes.some((upvote) => upvote.userId === user.id),
    }));
    const commentsFiltered = {
      items: extendedComments
        .sort((a, b) =>
          b.upvotes - a.upvotes == 0
            ? (<Date>b.createdAt).getTime() - (<Date>a.createdAt).getTime()
            : b.upvotes - a.upvotes,
        )
        .slice(0, Number(app().get(ConfigService).get<number>('PAGINATION_PAGE_SIZE')))
        .map((comment) => ({
          ...omit(comment, 'validatedAt', 'deletedAt', 'author'),
          author: {
            ...omit(comment.author, 'UEsSubscriptions'),
            commentValidForSemesters: comment.author.UEsSubscriptions.map((sub) => sub.semesterId),
          },
          answers: comment.answers.map((answer) => ({
            ...omit(answer, 'deletedAt'),
            createdAt: answer.createdAt.toISOString(),
            updatedAt: answer.updatedAt.toISOString(),
            status: CommentStatus.VALIDATED,
          })),
          updatedAt: comment.updatedAt.toISOString(),
          createdAt: comment.createdAt.toISOString(),
          status: CommentStatus.VALIDATED,
        }))
        .map((comment) => {
          if (comment.isAnonymous && comment.author.id !== user.id) delete comment.author;
          return comment;
        }),
      itemCount: comments.length,
      itemsPerPage: Number(app().get(ConfigService).get<number>('PAGINATION_PAGE_SIZE')),
    };
    return pactum.spec().withBearerToken(user.token).get(`/ue/${ue.code}/comments`).expectUEComments(commentsFiltered);
  });

  it('should return the second page of comments', async () => {
    const extendedComments = (
      await app()
        .get(PrismaService)
        .uEComment.findMany(
          SelectComment(
            {
              select: {
                upvotes: true,
              },
            },
            user.id,
            ue.code,
          ),
        )
    ).map((comment) => ({
      ...comment,
      upvotes: comment.upvotes.length,
      upvoted: comment.upvotes.some((upvote) => upvote.userId === user.id),
    }));
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get(`/ue/${ue.code}/comments`)
      .withQueryParams('page', 2)
      .expectUEComments({
        items: extendedComments
          .sort((a, b) =>
            b.upvotes - a.upvotes == 0
              ? (<Date>b.createdAt).getTime() - (<Date>a.createdAt).getTime()
              : b.upvotes - a.upvotes,
          )
          .slice(
            Number(app().get(ConfigService).get<number>('PAGINATION_PAGE_SIZE')),
            Number(app().get(ConfigService).get<number>('PAGINATION_PAGE_SIZE')) * 2,
          )
          .map((comment) => ({
            ...omit(comment, 'validatedAt', 'deletedAt', 'author'),
            author: {
              ...omit(comment.author, 'UEsSubscriptions'),
              commentValidForSemesters: comment.author.UEsSubscriptions.map((sub) => sub.semesterId),
            },
            answers: comment.answers.map((answer) => ({
              ...omit(answer, 'deletedAt'),
              createdAt: answer.createdAt.toISOString(),
              updatedAt: answer.updatedAt.toISOString(),
              status: CommentStatus.VALIDATED,
            })),
            updatedAt: comment.updatedAt.toISOString(),
            createdAt: comment.createdAt.toISOString(),
            status: CommentStatus.VALIDATED,
          }))
          .map((comment) => {
            if (comment.isAnonymous && comment.author.id !== user.id) delete comment.author;
            return comment;
          }),
        itemCount: comments.length,
        itemsPerPage: Number(app().get(ConfigService).get<number>('PAGINATION_PAGE_SIZE')),
      });
  });

  it('should return comments with lastValidatedBodies', async () => {
    await app()
      .get(PrismaService)
      .uEComment.updateMany({
        data: {
          lastValidatedBody: 'I like to spread fake news in my comments !',
        },
      });
    const extendedComments = (
      await app()
        .get(PrismaService)
        .uEComment.findMany(
          SelectComment(
            {
              select: {
                upvotes: true,
              },
            },
            user.id,
            ue.code,
            true,
            true,
          ),
        )
    ).map((comment) => ({
      ...comment,
      upvotes: comment.upvotes.length,
      upvoted: comment.upvotes.some((upvote) => upvote.userId === user.id),
    }));
    const commentsFiltered = {
      items: extendedComments
        .sort((a, b) =>
          b.upvotes - a.upvotes == 0
            ? (<Date>b.createdAt).getTime() - (<Date>a.createdAt).getTime()
            : b.upvotes - a.upvotes,
        )
        .slice(0, Number(app().get(ConfigService).get<number>('PAGINATION_PAGE_SIZE')))
        .map((comment) => ({
          ...omit(comment, 'validatedAt', 'deletedAt', 'author'),
          author: {
            ...omit(comment.author, 'UEsSubscriptions'),
            commentValidForSemesters: comment.author.UEsSubscriptions.map((sub) => sub.semesterId),
          },
          answers: comment.answers.map((answer) => ({
            ...omit(answer, 'deletedAt'),
            createdAt: answer.createdAt.toISOString(),
            updatedAt: answer.updatedAt.toISOString(),
            status: CommentStatus.VALIDATED,
          })),
          lastValidatedBody: 'I like to spread fake news in my comments !',
          updatedAt: comment.updatedAt.toISOString(),
          createdAt: comment.createdAt.toISOString(),
          status: CommentStatus.VALIDATED,
        })),
      itemCount: comments.length,
      itemsPerPage: Number(app().get(ConfigService).get<number>('PAGINATION_PAGE_SIZE')),
    };
    return pactum
      .spec()
      .withBearerToken(moderator.token)
      .get(`/ue/${ue.code}/comments`)
      .expectUEComments(commentsFiltered);
  });
});

export default GetCommentsE2ESpec;
