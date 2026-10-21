import { UserMicroResDto } from '@/users/dto/res/user-micro-res.dto.js';

export class ApplicationResDto {
  id: string;
  name: string;
  redirectUrl: string;
  owner: UserMicroResDto;
}
