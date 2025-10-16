import { ImageMediaPreset } from '@prisma/client';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export default class ImageMediaUploadReqDto {
  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(1920)
  width?: number;

  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(1080)
  height?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  quality?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  effort?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(3)
  rotation?: 0 | 1 | 2 | 3;

  @IsOptional()
  @IsString()
  @IsEnum(ImageMediaPreset)
  preset?: ImageMediaPreset;

  /** By default, images are NOT public and only accessible to logged users. */
  @IsOptional()
  @IsBoolean()
  public?: boolean;
}
