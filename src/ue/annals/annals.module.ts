import { Module } from '@nestjs/common';
import { AnnalsService } from './annals.service';
import { AnnalsController } from './annals.controller';
import { UEModule } from '../ue.module';
import { CommentsModule } from '../comments/comments.module';

@Module({
  controllers: [AnnalsController],
  providers: [AnnalsService],
  imports: [CommentsModule, UEModule],
})
export class AnnalsModule {}
