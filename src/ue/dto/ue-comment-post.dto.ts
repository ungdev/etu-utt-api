import { Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UeCommentPostDto {
  @IsNotEmpty()
  @IsString()
  body: string;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isAnonymous: boolean;
}
