import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive } from 'class-validator';

/**
 * Query parameters to get reported comments.
 * @property page The page number to get. Defaults to 1 (Starting at 1).
 */
export default class GetReportedCommentsReqDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @IsOptional()
  page?: number;
}
