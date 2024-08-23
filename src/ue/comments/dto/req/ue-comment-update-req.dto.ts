import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

/**
 * Body data required to update a comment.
 * @property body The new body of the comment. Must be at least 5 characters long. Optional.
 * @property isAnonymous Whether the comment should be anonymous or not. Optional.
 */
export default class UeCommentUpdateReqDto {
  @IsString()
  @MinLength(5)
  @IsOptional()
  body?: string;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isAnonymous?: boolean;
}
