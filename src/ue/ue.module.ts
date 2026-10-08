import { Module } from '@nestjs/common';
import { UeController } from '@/ue/ue.controller.js';
import { UeService } from '@/ue/ue.service.js';
import { CommentsController } from '@/ue/comments/comments.controller.js';
import { AnnalsController } from '@/ue/annals/annals.controller.js';
import { CreditController } from '@/ue/credit/credit.controller.js';
import { AnnalsService } from '@/ue/annals/annals.service.js';
import { CreditService } from '@/ue/credit/credit.service.js';
import { CommentsService } from '@/ue/comments/comments.service.js';
import { CourseService } from '@/ue/course/course.service.js';

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
