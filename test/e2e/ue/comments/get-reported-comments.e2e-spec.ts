import { faker } from '@faker-js/faker';
import * as pactum from 'pactum';
import { ERROR_CODE } from 'src/exceptions';
import { ConfigModule } from '../../../../src/config/config.module';
import { PrismaService } from '../../../../src/prisma/prisma.service';
import {
  createBranch,
  createBranchOption,
  createComment,
  createCommentReply,
  createCommentReplyReport,
  createCommentReport,
  createCommentReportReason,
  createSemester,
  createUe,
  createUeof,
  createUser,
  FakeComment,
} from '../../../utils/fakedb';
import { e2eSuite } from '../../../utils/test_utils';
import { Prisma } from '@prisma/client';

const GetReportedComments = e2eSuite('GET /ue/comments/reports', (app) => {
  const userModerator = createUser(app, {
    login: 'user2',
    permissions: ['API_SEE_OPINIONS_UE', 'API_GIVE_OPINIONS_UE', 'API_MODERATE_COMMENTS'],
  });
  const semester = createSemester(app);
  const branch = createBranch(app);
  const branchOption = createBranchOption(app, { branch });
  const ue = createUe(app);
  const ueof = createUeof(app, { branchOptions: [branchOption], semesters: [semester], ue });
  const reportReason = createCommentReportReason(app, { name: 'meh' });
  const comments: FakeComment[] = [];
  for (let i = 1; i <= 22; i++) {
    const commentAuthor = createUser(app, {
      login: `user${i + 10}`,
      studentId: i + 10,
    });
    const comment = createComment(app, { ueof, user: commentAuthor, semester });
    comments.push(comment);
    const commentReporter = createUser(app, {
      login: `user${i + 100}`,
      studentId: i + 100,
    });
    createCommentReport(
      app,
      { user: commentReporter, comment, reason: reportReason },
      {
        body: faker.word.words(),
        reportedBody: comment.body,
        mitigated: i % 2 === 0,
      },
    );
  }

  const reportedCommentsWhereClause: Prisma.UeCommentWhereInput = {
    OR: [
      { reports: { some: { mitigated: false } } }, // Le commentaire est signalé
      { answers: { some: { reports: { some: { mitigated: false } } } } }, // Une de ses réponses est signalée
    ],
  };

  it('should return a 401 as user is not authenticated', () => {
    return pactum.spec().get('/ue/comments/reports').expectAppError(ERROR_CODE.NOT_LOGGED_IN);
  });

  it('should return a 403 as user does not have permission to moderate comments', async () => {
    const userNoPermission = await createUser(app, {}, true);
    const userNotModerator = await createUser(
      app,
      { permissions: ['API_SEE_OPINIONS_UE', 'API_GIVE_OPINIONS_UE'] },
      true,
    );
    await pactum
      .spec()
      .withBearerToken(userNoPermission.token)
      .get('/ue/comments/reports')
      .expectAppError(ERROR_CODE.FORBIDDEN_NOT_ENOUGH_API_PERMISSIONS, 'API_MODERATE_COMMENTS');
    await pactum
      .spec()
      .withBearerToken(userNotModerator.token)
      .get('/ue/comments/reports')
      .expectAppError(ERROR_CODE.FORBIDDEN_NOT_ENOUGH_API_PERMISSIONS, 'API_MODERATE_COMMENTS');
  });

  it('should return a 403 as user uses a wrong page', () => {
    return pactum
      .spec()
      .withBearerToken(userModerator.token)
      .get('/ue/comments/reports')
      .withQueryParams({
        page: -1,
      })
      .expectAppError(ERROR_CODE.PARAM_NOT_POSITIVE, 'page');
  });

  it('should return the first page of reported comments', async () => {
    const comments = await app()
      .get(PrismaService)
      .normalize.ueComment.findMany({
        args: {
          userId: userModerator.id,
          bypassAnonymousData: true,
          includeDeleted: false,
          includeHiddenComments: true,
          includeReports: true,
        },
        where: reportedCommentsWhereClause,
      });

    const commentsFiltered = {
      items: JSON.parse(JSON.stringify(comments)).slice(0, app().get(ConfigModule).PAGINATION_PAGE_SIZE),
      itemCount: comments.length,
      itemsPerPage: app().get(ConfigModule).PAGINATION_PAGE_SIZE,
    };
    return pactum
      .spec()
      .withBearerToken(userModerator.token)
      .get('/ue/comments/reports')
      .expectJsonMatch(commentsFiltered);
  });

  it('should return the second page of reported comments', async () => {
    const comments = await app()
      .get(PrismaService)
      .normalize.ueComment.findMany({
        args: {
          userId: userModerator.id,
          bypassAnonymousData: true,
          includeDeleted: false,
          includeHiddenComments: true,
          includeReports: true,
        },
        where: reportedCommentsWhereClause,
      });
    const PAGINATION_PAGE_SIZE = app().get(ConfigModule).PAGINATION_PAGE_SIZE;
    const commentsFiltered = {
      items: JSON.parse(JSON.stringify(comments)).slice(PAGINATION_PAGE_SIZE, 2 * PAGINATION_PAGE_SIZE),
      itemCount: comments.length,
      itemsPerPage: app().get(ConfigModule).PAGINATION_PAGE_SIZE,
    };
    return pactum
      .spec()
      .withBearerToken(userModerator.token)
      .get('/ue/comments/reports')
      .withQueryParams({ page: 2 })
      .expectJsonMatch(commentsFiltered);
  });

  it('should include comments with reported replies', async () => {
    const cleanCommentAuthor = await createUser(app, { login: 'cleanAuthor' }, true);
    const cleanComment = await createComment(app, { ueof, user: cleanCommentAuthor, semester }, {}, true);
    const replyAuthor = await createUser(app, { login: 'replyAuthor' }, true);
    const commentReply = await createCommentReply(app, { user: replyAuthor, comment: cleanComment }, {}, true);
    const replyReporter = await createUser(app, { login: 'replyReporter' }, true);
    await createCommentReplyReport(
      app,
      { user: replyReporter, reply: commentReply, reason: reportReason },
      {
        body: 'This reply is problematic',
        reportedBody: commentReply.body,
        mitigated: false,
      },
      true,
    );

    const comments = await app()
      .get(PrismaService)
      .normalize.ueComment.findMany({
        args: {
          userId: userModerator.id,
          bypassAnonymousData: true,
          includeDeleted: false,
          includeHiddenComments: true,
          includeReports: true,
        },
        where: reportedCommentsWhereClause,
      });
    const PAGINATION_PAGE_SIZE = app().get(ConfigModule).PAGINATION_PAGE_SIZE;
    const commentsFiltered = {
      items: JSON.parse(JSON.stringify(comments)).slice(0,PAGINATION_PAGE_SIZE),
      itemCount: comments.length,
      itemsPerPage: PAGINATION_PAGE_SIZE,
    };

    expect(commentsFiltered.items).toContainEqual(expect.objectContaining({ id: cleanComment.id }));

    await pactum
      .spec()
      .withBearerToken(userModerator.token)
      .get('/ue/comments/reports')
      .expectJsonMatch(commentsFiltered);
  });
});

export default GetReportedComments;
