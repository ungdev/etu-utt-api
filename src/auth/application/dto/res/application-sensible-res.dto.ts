import UserMicroResDto from "../../../../users/dto/res/user-micro-res.dto";

export default class ApplicationSensibleResDto {
  id: string;
  name: string;
  redirectUrl: string;
  clientSecret: string;
  owner: UserMicroResDto;
}
