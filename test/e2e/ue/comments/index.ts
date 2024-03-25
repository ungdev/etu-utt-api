import { INestApplication } from '@nestjs/common';
import GetCommentsE2ESpec from './get-comment.e2e-spec';
import DeleteComment from './delete-comment.e2e-spec';
import DeleteCommentReply from './delete-reply.e2e-spec';
import DeleteUpvote from './delete-upvote.e2e-spec';
import PostCommment from './post-comment.e2e-spec';
import PostCommmentReply from './post-reply.e2e-spec';
import PostUpvote from './post-upvote.e2e-spec';
import UpdateComment from './update-comment.e2e-spec';
import UpdateCommentReply from './update-reply.e2e-spec';

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
  });
}
