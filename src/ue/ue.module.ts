import { Module } from '@nestjs/common';
import { UeController } from '@/ue/ue.controller';
import { UeService } from '@/ue/ue.service';
import { CommentsController } from '@/ue/comments/comments.controller';
import { AnnalsController } from '@/ue/annals/annals.controller';
import { CreditController } from '@/ue/credit/credit.controller';
import { AnnalsService } from '@/ue/annals/annals.service';
import { CreditService } from '@/ue/credit/credit.service';
import { CommentsService } from '@/ue/comments/comments.service';
import { CourseService } from '@/ue/course/course.service';

/**
 * Defines the `UE` module. This module handles all routes prefixed by `/ue`.
 * Includes `UE` listing, details, comments, comment replies, ratings
 */
@Module({
  controllers: [CommentsController, AnnalsController, CreditController, UeController],
  providers: [CommentsService, AnnalsService, CreditService, UeService, CourseService],
  exports: [UeService, CourseService],
})
export class UeModule {}
