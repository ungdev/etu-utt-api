import { IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * Body data required to create a new comment reply.
 * @property body The body of the reply. Must be at least 5 characters long.
 */
export class CommentReplyDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  body: string;
}
