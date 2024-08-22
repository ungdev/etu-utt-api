import { Type } from 'class-transformer';
import { IsAlphanumeric, IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Body data required to create a new comment.
 * @property body The body of the comment. Must be at least 5 characters long.
 * @property isAnonymous Whether the comment should be anonymous or not. Defaults to false.
 */
export class UeCommentPostDto {
  @IsNotEmpty()
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  body: string;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isAnonymous?: boolean;

  @IsString()
  @IsNotEmpty()
  @IsAlphanumeric()
  @MinLength(3)
  @MaxLength(5)
  ueCode: string;
}
