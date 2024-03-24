import { INestApplication } from '@nestjs/common';
import { Asso } from '@prisma/client';
import { PrismaService } from '../src/prisma/prisma.service';

export function suite(name: string, func: (app: () => INestApplication) => void) {
  return (app: () => INestApplication) =>
    describe(name, () => {
      beforeAll(async () => {
        await app().get(PrismaService).cleanDb();
      });
      func(app);
    });
}
