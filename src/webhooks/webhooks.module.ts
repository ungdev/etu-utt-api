import { Module } from '@nestjs/common';
import { WebhooksController } from '@/webhooks/webhooks.controller.js';
import { WebhooksService } from '@/webhooks/webhooks.service.js';
import { DnumService } from '@/dnum/dnum.service.js';

/**
 * Defines the `Webhooks` module. This module handles all routes prefixed by `/`.
 */
@Module({
  controllers: [WebhooksController],
  providers: [WebhooksService, DnumService],
  imports: [],
})
export class WebhooksModule {}
