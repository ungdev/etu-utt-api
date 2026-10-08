import { INestApplication } from '@nestjs/common';
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
import { describe } from 'vitest';

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
