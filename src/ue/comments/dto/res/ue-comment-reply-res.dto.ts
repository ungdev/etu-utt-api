import UeCommentAuthorResDto from '@/ue/comments/dto/res/ue-comment-author-res.dto';

export default class UeCommentReplyResDto {
  id: string;
  author: UeCommentAuthorResDto;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}
