import UserMicroResDto from "../../../users/dto/res/user-micro-res.dto";

export default class AssoPresident {
  role: AssoPresident_Role;
  user: UserMicroResDto;
}

class AssoPresident_Role {
  id: string;
  name: string;
}
