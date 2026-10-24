import { Module } from '@nestjs/common';
import { WebhooksController } from '@/webhooks/webhooks.controller.js';
import { WebhooksService } from '@/webhooks/webhooks.service.js';

/**
 * Defines the `Webhooks` module. This module handles all routes prefixed by `/`.
 * Includes `Webhooks` listing, details
 */
@Module({
  controllers: [WebhooksController],
  providers: [WebhooksService],
  imports: [],
})
export class WebhooksModule {}
