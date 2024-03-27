import { Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

/**
 * Body data required to create a new comment.
 * @property body The body of the comment. Must be at least 5 characters long.
 * @property isAnonymous Whether the comment should be anonymous or not. Defaults to false.
 */
export class UECommentPostDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  body: string;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isAnonymous?: boolean;
}
