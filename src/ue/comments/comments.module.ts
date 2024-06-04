import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { UEModule } from '../ue.module';

@Module({
  controllers: [CommentsController],
  providers: [CommentsService],
  imports: [UEModule],
})
export class CommentsModule {}
