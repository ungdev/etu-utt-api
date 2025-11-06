import { ImageMediaPreset } from '../../../../prisma/types';

export default class ImageMediaUploadResDto {
  id: string;
  width: number;
  height: number;
  size: number;
  isPublic: boolean;
  preset: ImageMediaPreset;
}
