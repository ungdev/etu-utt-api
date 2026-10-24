import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AppException, ERROR_CODE } from '@/exceptions.js';
import { ConfigService } from '@/config/config.service.js';

@Injectable()
export class WebhooksTokenGuard implements CanActivate {
  constructor(readonly config: ConfigService) {}
  canActivate(context: ExecutionContext): boolean {
    if (context.switchToHttp().getRequest().headers['x-webhook-token'] === this.config.WEBHOOK_TOKEN) return true;

    throw new AppException(ERROR_CODE.INVALID_WEBHOOK_TOKEN);
  }
}
