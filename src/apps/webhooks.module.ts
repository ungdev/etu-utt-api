// src/apps/webhooks.module.ts
import { DynamicModule, INestApplication, VersioningType } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from '@/prisma/prisma.module.js';
import { ConfigModule } from '@/config/config.module.js';
import { HttpModule } from '@/http/http.module.js';
import { MailModule } from '@/mail/mail.module.js';
import { WebhooksModule } from '@/webhooks/webhooks.module.js';
import { AppValidationPipe } from '@/app.pipe.js';
import { NotFoundFilter } from '@/exceptions.js';
import { WebhooksTokenGuard } from '@/webhooks/guard/webhooksToken.guard.js';
import { DnumModule } from '@/dnum/dnum.module.js';

export class WebhooksAppModule {
  static register(): DynamicModule {
    return {
      module: WebhooksAppModule,
      imports: [ConfigModule, HttpModule, PrismaModule, MailModule, WebhooksModule, DnumModule],
      providers: [{ provide: APP_GUARD, useClass: WebhooksTokenGuard }],
    };
  }

  static initApp(app: INestApplication) {
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(new AppValidationPipe());
    app.useGlobalFilters(new NotFoundFilter());
    app.enableShutdownHooks();
  }
}
