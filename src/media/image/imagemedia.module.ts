import { Module } from '@nestjs/common';
import { ImageMediaController } from '@/media/image/imagemedia.controller';
import { ImageMediaService } from '@/media/image/imagemedia.service';

@Module({
  controllers: [ImageMediaController],
  providers: [ImageMediaService],
  exports: [ImageMediaService],
})
export class ImageMediaModule {}
