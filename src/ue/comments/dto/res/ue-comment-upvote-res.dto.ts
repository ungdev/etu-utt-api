export class UeCommentUpvoteResDto {
  upvoted: boolean;
}

export class UeCommentUpvoteResDto$True extends UeCommentUpvoteResDto {
  upvoted = true;
}

export class UeCommentUpvoteResDto$False extends UeCommentUpvoteResDto {
  upvoted = false;
}
