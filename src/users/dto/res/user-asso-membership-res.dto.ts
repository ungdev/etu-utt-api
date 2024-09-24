import { Translation } from '../../../prisma/types';
import { ApiProperty } from '@nestjs/swagger';

export default class UserAssoMembershipResDto {
  role: string;
  startAt: Date;
  endAt: Date;
  asso: UserAssoMembershipResDto_Asso;
}

class UserAssoMembershipResDto_Asso {
  name: string;
  logo: string;
  mail: string;
  @ApiProperty({ type: String })
  shortDescription: Translation;
}
