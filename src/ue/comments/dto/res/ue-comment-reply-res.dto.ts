import UeCommentAuthorResDto from './ue-comment-author-res.dto';

export default class UeCommentReplyResDto {
  id: string;
  author: UeCommentAuthorResDto;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}
