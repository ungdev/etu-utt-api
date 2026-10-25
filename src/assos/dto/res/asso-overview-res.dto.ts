import { Translation } from '@/prisma/types.js';
import { ApiProperty } from '@nestjs/swagger';
import { AssoPresident } from '@/assos/dto/res/asso-president-res.dto.js';

export class AssoOverviewResDto {
  id: string;
  name: string;
  logo: string;
  @ApiProperty({ type: String })
  shortDescription: Translation;
  president: AssoPresident;
}
