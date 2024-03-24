import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigModule } from '../config/config.module';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(config: ConfigModule) {
    super({
      datasources: {
        db: {
          url: config.DATABASE_URL,
        },
      },
    });
  }
}
