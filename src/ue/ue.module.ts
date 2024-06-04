import { Module } from '@nestjs/common';
import { UEController } from './ue.controller';
import { UEService } from './ue.service';

/**
 * Defines the `UE` module. This module handles all routes prefixed by `/ue`.
 * Includes `UE` listing, details, comments, comment replies, ratings
 */
@Module({
  controllers: [UEController],
  providers: [UEService],
  exports: [UEService],
})
export class UEModule {}
