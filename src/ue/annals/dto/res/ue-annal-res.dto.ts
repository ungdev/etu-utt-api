import UeCommentAuthorResDto from '../../../comments/dto/res/ue-comment-author-res.dto';
import UeAnnalTypeResDto from './ue-annal-type-res.dto';

export default class UeAnnalResDto {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  semesterId: string;
  sender: UeCommentAuthorResDto;
  type: UeAnnalTypeResDto;
  ueCode: string;
  status: number;
}
