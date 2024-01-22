import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CommentReplyDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  body: string;
}
