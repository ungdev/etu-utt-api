import { Translation } from '../../../prisma/types';
import { ApiProperty } from '@nestjs/swagger';

export default class AssoDetailResDto {
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
}

class AssoDetail_President {
  role: AssoDetail_President_Role;
  user: AssoDetail_President_User;
}

class AssoDetail_President_Role {
  id: string;
  name: string;
}

class AssoDetail_President_User {
  firstName: string;
  lastName: string;
}
