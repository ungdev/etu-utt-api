import { UeCommentAuthorResDto } from '@/ue/comments/dto/res/ue-comment-author-res.dto.js';
import { UeCommentReportResDto } from '@/ue/comments/dto/res/ue-comment-report-res.dto.js';
import { ApiProperty } from '@nestjs/swagger';

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
  @ApiProperty({ description: "This value is not present whenever the api key making the request doesn't have the right to see comment reports" })
  reports?: UeCommentReportResDto[];
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
