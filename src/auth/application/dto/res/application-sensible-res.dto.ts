import { UserMicroResDto } from '@/users/dto/res/user-micro-res.dto.js';

export class ApplicationSensibleResDto {
  id: string;
  name: string;
  redirectUrl: string;
  clientSecret: string;
  owner: UserMicroResDto;
}
