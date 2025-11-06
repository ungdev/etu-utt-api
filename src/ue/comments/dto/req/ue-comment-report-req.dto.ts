import { IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * Query parameters to get reported comments.
 * @property body The user message associated with the report
 * @property reason The report reason
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
