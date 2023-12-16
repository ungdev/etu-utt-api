import { IsNotEmpty, IsString } from 'class-validator';

export class CommentReplyDto {
  @IsString()
  @IsNotEmpty()
  body: string;
}
