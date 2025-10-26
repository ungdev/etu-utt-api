import { IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * Query parameters to get reported comments.
 * @property page The page number to get. Defaults to 1 (Starting at 1).
 */
export default class UeCommentReportReqDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  body: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
