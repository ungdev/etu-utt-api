import { Module } from '@nestjs/common';
import { ImageMediaController } from './imagemedia.controller';
import { ImageMediaService } from './imagemedia.service';

@Module({
  controllers: [ImageMediaController],
  providers: [ImageMediaService],
  exports: [ImageMediaService],
})
export class ImageMediaModule {}
