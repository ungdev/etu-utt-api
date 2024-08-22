import {Translation} from "../../../prisma/types";
import {ApiProperty} from "@nestjs/swagger";

export default class AssoOverview {
  id: string;
  name: string;
  logo: string;
  @ApiProperty({ type: String })
  shortDescription: Translation;
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
