import { INestApplication } from '@nestjs/common';
import GetCommentsE2ESpec from '#/e2e/ue/comments/get-comment.e2e-spec';
import DeleteComment from '#/e2e/ue/comments/delete-comment.e2e-spec';
import DeleteCommentReply from '#/e2e/ue/comments/delete-reply.e2e-spec';
import DeleteUpvote from '#/e2e/ue/comments/delete-upvote.e2e-spec';
import PostCommment from '#/e2e/ue/comments/post-comment.e2e-spec';
import PostCommmentReply from '#/e2e/ue/comments/post-reply.e2e-spec';
import PostUpvote from '#/e2e/ue/comments/post-upvote.e2e-spec';
import UpdateComment from '#/e2e/ue/comments/update-comment.e2e-spec';
import UpdateCommentReply from '#/e2e/ue/comments/update-reply.e2e-spec';
import GetCommentFromIdE2ESpec from '#/e2e/ue/comments/get-comment-from-id.e2e-spec';

export default function CommentsE2ESpec(app: () => INestApplication) {
  describe('Comments', () => {
    GetCommentsE2ESpec(app);
    PostCommment(app);
    PostCommmentReply(app);
    UpdateComment(app);
    DeleteComment(app);
    UpdateCommentReply(app);
    DeleteCommentReply(app);
    PostUpvote(app);
    DeleteUpvote(app);
    GetCommentFromIdE2ESpec(app);
  });
}
