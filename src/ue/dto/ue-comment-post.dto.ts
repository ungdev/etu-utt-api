import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class UeCommentPostDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  body: string;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isAnonymous?: boolean;
}
