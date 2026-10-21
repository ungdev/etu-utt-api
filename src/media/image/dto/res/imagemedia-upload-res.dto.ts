import { ImageMediaPreset } from '@/prisma/types';
import { ApiResponseProperty } from '@nestjs/swagger';

export default class ImageMediaUploadResDto {
  @ApiResponseProperty({ format: 'uuid' })
  id: string;
  @ApiResponseProperty({ example: 256 })
  width: number;
  @ApiResponseProperty({ example: 256 })
  height: number;
  @ApiResponseProperty({ example: 34567 })
  size: number;
  isPublic: boolean;
  @ApiResponseProperty({ enum: Object.values(ImageMediaPreset) })
  preset: ImageMediaPreset;
}
