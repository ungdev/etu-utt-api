import { Module } from '@nestjs/common';
import { WebhooksController } from '@/webhooks/webhooks.controller.js';
import { WebhooksService } from '@/webhooks/webhooks.service.js';
import { DnumService } from '@/dnum/dnum.service.js';
import { APP_GUARD } from '@nestjs/core';
import { WebhooksTokenGuard } from './guard/webhooksToken.guard.js';

/**
 * Defines the `Webhooks` module. This module handles all routes prefixed by `/`.
 */
@Module({
  controllers: [WebhooksController],
  providers: [WebhooksService, DnumService, { provide: APP_GUARD, useClass: WebhooksTokenGuard }],
  imports: [],
})
export class WebhooksModule {}
