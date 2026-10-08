import { Translation } from '@/prisma/types.js';
import { ApiProperty } from '@nestjs/swagger';
import { AssoPresident } from '@/assos/dto/res/asso-president-res.dto.js';

export class AssoDetailResDto {
  id: string;
  name: string;
  mail: string;
  phoneNumber: string;
  website: string;
  logo: string;
  @ApiProperty({ type: String })
  description: Translation;
  president: AssoPresident;
}
