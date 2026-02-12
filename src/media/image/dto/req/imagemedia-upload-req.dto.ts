import { ApiProperty } from '@nestjs/swagger';
import { ImageMediaPreset } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export default class ImageMediaUploadReqDto {
  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(1920)
  @Type(() => Number)
  width?: number;

  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(1080)
  @Type(() => Number)
  height?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  quality?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  @Type(() => Number)
  effort?: number;

  /** The number of 90° clockwise rotations to be performed. Defaults to 0 */
  @ApiProperty({
    default: 0,
    enum: [0, 1, 2, 3],
    required: false,
    description: 'The number of 90° clockwise rotations to be performed.',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(3)
  @Type(() => Number)
  rotation?: 0 | 1 | 2 | 3;

  @ApiProperty({
    default: ImageMediaPreset.CUSTOM,
    enum: Object.values(ImageMediaPreset),
    required: false,
    description: 'The preset to use for image processing.',
  })
  @IsOptional()
  @IsString()
  @IsEnum(ImageMediaPreset)
  preset?: ImageMediaPreset;

  /** By default, images are NOT public and only accessible to logged users. */
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  public?: boolean;
}
