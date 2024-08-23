import UeCommentAuthorResDto from './ue-comment-author-res.dto';

export default class UeCommentResDto {
  id: string;
  author: UeCommentAuthorResDto;
  createdAt: Date;
  updatedAt: Date;
  semester: string;
  isAnonymous: boolean;
  body: string;
  upvotes: number;
  upvoted: boolean;
  status: number;
  answers: CommentResDto_Answer[];
  lastValidatedBody?: string;
}

class CommentResDto_Answer {
  id: string;
  author: UeCommentAuthorResDto;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  status: number;
}
