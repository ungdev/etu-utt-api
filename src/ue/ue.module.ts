import { Module } from '@nestjs/common';
import { UeController } from './ue.controller';
import { UeService } from './ue.service';
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
  controllers: [CommentsController, AnnalsController, CreditController, UeController],
  providers: [CommentsService, AnnalsService, CreditService, UeService],
  exports: [UeService],
})
export class UeModule {}
