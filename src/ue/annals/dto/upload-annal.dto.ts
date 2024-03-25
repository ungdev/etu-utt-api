import { Type } from 'class-transformer';
import { IsDefined, IsInt, Max, Min } from 'class-validator';

/**
 * Query parameters to get comments.
 * @property page The page number to get. Defaults to 1 (Starting at 1).
 */
export class UploadAnnalDto {
  @IsDefined()
  @Type(() => Number)
  @IsInt()
  @Min(-1)
  @Max(1)
  rotate: 0 | 1 | -1;
}
