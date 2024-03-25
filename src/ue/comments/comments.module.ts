import { Module } from '@nestjs/common';
import { UEService } from '../ue.service';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

@Module({
  controllers: [CommentsController],
  providers: [CommentsService, UEService],
})
export class CommentsModule {}
