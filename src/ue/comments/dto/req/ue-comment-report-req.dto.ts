import { IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * Body data required to report a comment
 * @property body The user message associated with the report. Must be at least 5 characters long
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
