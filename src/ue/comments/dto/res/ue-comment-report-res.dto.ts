import { UeCommentAuthorResDto } from './ue-comment-author-res.dto.js';

export class UeCommentReportResDto {
  id: string;
  body: string;
  createdAt: Date;
  mitigated: boolean;
  reportedBody: string;
  user: UeCommentAuthorResDto;
  reason: string;
}
