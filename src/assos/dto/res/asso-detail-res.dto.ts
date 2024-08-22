import {Translation} from "../../../prisma/types";
import {ApiProperty} from "@nestjs/swagger";

export default class AssoDetail {
  id: string;
  login: string;
  name: string;
  mail: string;
  phoneNumber: string;
  website: string;
  logo: string;
  @ApiProperty({ type: String })
  description: Translation;
  president: AssoDetail_President;
};

class AssoDetail_President {
  roleName: string;
  user: AssoDetail_President_PresidentUser
}

class AssoDetail_President_PresidentUser {
  firstName: string;
  lastName: string;
}
