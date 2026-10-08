import { Module } from '@nestjs/common';
import { ImageMediaController } from '@/media/image/imagemedia.controller.js';
import { ImageMediaService } from '@/media/image/imagemedia.service.js';

@Module({
  controllers: [ImageMediaController],
  providers: [ImageMediaService],
  exports: [ImageMediaService],
})
export class ImageMediaModule {}
