import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import AssosMemberUpdateReqDto from './assos-member-update.dto';

export default class AssosMemberCreateReqDto extends AssosMemberUpdateReqDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  userId: string;
}
