import { Type } from 'class-transformer';
import { IsDefined, IsIn } from 'class-validator';

export class UploadAnnalDto {
  @IsDefined()
  @Type(() => Number)
  @IsIn([0, 1, 2, 3])
  rotate: 0 | 1 | 2 | 3;
}
