import { UeCommentAuthorResDto } from '@/ue/comments/dto/res/ue-comment-author-res.dto.js';
import { UeCommentReportResDto } from '@/ue/comments/dto/res/ue-comment-report-res.dto.js';

export class UeCommentResDto {
  id: string;
  author?: UeCommentAuthorResDto;
  createdAt: Date;
  updatedAt: Date;
  semester: string;
  isAnonymous: boolean;
  body: string;
  upvotes: number;
  upvoted: boolean;
  status: number;
  answers: CommentResDto_Answer[];
  reports: UeCommentReportResDto[];
}

class CommentResDto_Answer {
  id: string;
  author: UeCommentAuthorResDto;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  status: number;
  reports: UeCommentReportResDto[];
}
