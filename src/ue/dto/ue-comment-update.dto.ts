import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class UeCommentUpdateDto {
  @IsString()
  @MinLength(5)
  @IsOptional()
  body?: string;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isAnonymous?: boolean;
}
