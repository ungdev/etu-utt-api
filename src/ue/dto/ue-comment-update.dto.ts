import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UeCommentUpdateDto {
  @IsString()
  @IsOptional()
  body: string;

  @IsBoolean()
  @IsOptional()
  isAnonymous: boolean;
}
