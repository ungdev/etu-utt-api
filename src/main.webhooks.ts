import { NestFactory } from '@nestjs/core';
import { WebhooksAppModule } from '@/apps/webhooks.module.js';
import '@/std.type.js';

async function bootstrap() {
  const app = await NestFactory.create(WebhooksAppModule.register());
  WebhooksAppModule.initApp(app);
  await app.listen(3000);
}

bootstrap();
