import { UeCommentAuthorResDto } from '@/ue/comments/dto/res/ue-comment-author-res.dto.js';
import { UeAnnalTypeResDto } from '@/ue/annals/dto/res/ue-annal-type-res.dto.js';

export class UeAnnalResDto {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  semesterId: string;
  sender: UeCommentAuthorResDto;
  type: UeAnnalTypeResDto;
  status: number;
}
