import { Injectable } from '@nestjs/common';
import { ConfigService } from '@/config/config.service.js';
import { PrismaService } from '@/prisma/prisma.service.js';

@Injectable()
export class WebhooksService {
  constructor(
    readonly prisma: PrismaService,
    readonly config: ConfigService,
  ) {}
}
