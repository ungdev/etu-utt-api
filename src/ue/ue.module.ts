import { Module } from '@nestjs/common';
import { UEController } from './ue.controller';
import { UEService } from './ue.service';
import { CommentsController } from './comments/comments.controller';
import { AnnalsController } from './annals/annals.controller';
import { CreditController } from './credit/credit.controller';
import { AnnalsService } from './annals/annals.service';
import { CreditService } from './credit/credit.service';
import { CommentsService } from './comments/comments.service';

/**
 * Defines the `UE` module. This module handles all routes prefixed by `/ue`.
 * Includes `UE` listing, details, comments, comment replies, ratings
 */
@Module({
  controllers: [CommentsController, AnnalsController, CreditController, UEController],
  providers: [CommentsService, AnnalsService, CreditService, UEService],
  exports: [UEService],
})
export class UEModule {}
