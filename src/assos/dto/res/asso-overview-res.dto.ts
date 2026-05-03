import { Translation } from '@/prisma/types';
import { ApiProperty } from '@nestjs/swagger';
import AssoPresident from '@/assos/dto/res/asso-president-res.dto';

export default class AssoOverviewResDto {
  id: string;
  name: string;
  logo: string;
  @ApiProperty({ type: String })
  shortDescription: Translation;
  president: AssoPresident;
}
