import { ImageMediaPreset } from '@prisma/client';

export default class ImageMediaUploadResDto {
  id: string;
  width: number;
  height: number;
  size: number;
  isPublic: boolean;
  preset: ImageMediaPreset;
}
