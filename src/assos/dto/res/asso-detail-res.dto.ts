import { Translation } from '../../../prisma/types';
import { ApiProperty } from '@nestjs/swagger';
import AssoPresident from './asso-president-res.dto';

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
  president: AssoPresident;
}
