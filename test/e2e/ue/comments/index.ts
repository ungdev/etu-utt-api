import { INestApplication } from '@nestjs/common';
import DeleteComment from './delete-comment.e2e-spec';
import DeleteCommentReply from './delete-reply.e2e-spec';
import DeleteUpvote from './delete-upvote.e2e-spec';
import GetCommentFromIdE2ESpec from './get-comment-from-id.e2e-spec';
import GetCommentReportReason from './get-comment-report-reasons.e2e-spec';
import GetCommentsE2ESpec from './get-comment.e2e-spec';
import GetReportedComments from './get-reported-comments.e2e-spec';
import PostReportCommentReply from './post-comment-reply-report.e2e-spec';
import PostReportComment from './post-comment-report.e2e-spec';
import PostCommment from './post-comment.e2e-spec';
import PostCommmentReply from './post-reply.e2e-spec';
import PostUpvote from './post-upvote.e2e-spec';
import UpdateCommentReplyReport from './update-comment-reply-report.e2e-spec';
import UpdateCommentReport from './update-comment-report.e2e-spec';
import UpdateComment from './update-comment.e2e-spec';
import UpdateCommentReply from './update-reply.e2e-spec';

export default function CommentsE2ESpec(app: () => INestApplication) {
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
