import GetCommentsE2ESpec from '#/e2e/ue/comments/get-comment.e2e-spec.js';
import DeleteComment from '#/e2e/ue/comments/delete-comment.e2e-spec.js';
import DeleteCommentReply from '#/e2e/ue/comments/delete-reply.e2e-spec.js';
import DeleteUpvote from '#/e2e/ue/comments/delete-upvote.e2e-spec.js';
import PostCommment from '#/e2e/ue/comments/post-comment.e2e-spec.js';
import PostCommmentReply from '#/e2e/ue/comments/post-reply.e2e-spec.js';
import PostUpvote from '#/e2e/ue/comments/post-upvote.e2e-spec.js';
import UpdateComment from '#/e2e/ue/comments/update-comment.e2e-spec.js';
import UpdateCommentReply from '#/e2e/ue/comments/update-reply.e2e-spec.js';
import GetCommentFromIdE2ESpec from '#/e2e/ue/comments/get-comment-from-id.e2e-spec.js';
import { E2EAppProvider } from '#/utils/test_utils.js';
import GetCommentReportReason from '#/e2e/ue/comments/get-comment-report-reasons.e2e-spec.js';
import GetReportedComments from '#/e2e/ue/comments/get-reported-comments.e2e-spec.js';
import PostReportCommentReply from '#/e2e/ue/comments/post-comment-reply-report.e2e-spec.js';
import PostReportComment from '#/e2e/ue/comments/post-comment-report.e2e-spec.js';
import UpdateCommentReplyReport from '#/e2e/ue/comments/update-comment-reply-report.e2e-spec.js';
import UpdateCommentReport from '#/e2e/ue/comments/update-comment-report.e2e-spec.js';
import { describe } from 'vitest';

export default function CommentsE2ESpec(app: E2EAppProvider) {
  describe('Comments', () => {
    GetCommentsE2ESpec(app);
    GetCommentFromIdE2ESpec(app);
    GetReportedComments(app);
    GetCommentReportReason(app);
    PostCommment(app);
    PostCommmentReply(app);
    PostUpvote(app);
    PostReportComment(app);
    PostReportCommentReply(app);
    UpdateComment(app);
    UpdateCommentReply(app);
    UpdateCommentReport(app);
    UpdateCommentReplyReport(app);
    DeleteComment(app);
    DeleteCommentReply(app);
    DeleteUpvote(app);
  });
}
