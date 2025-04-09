import UserMicroResDto from '../../../../users/dto/res/user-micro-res.dto';

export default class ApplicationResDto {
  id: string;
  name: string;
  redirectUrl: string;
  owner: UserMicroResDto;
}
