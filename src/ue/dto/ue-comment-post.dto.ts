import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UeCommentPostDto {
  @IsNotEmpty()
  @IsString()
  body: string;

  @IsBoolean()
  @IsOptional()
  isAnonymous: boolean;
}
