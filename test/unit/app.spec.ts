import { describe, beforeAll, afterAll } from 'vitest';
import TimetableServiceUnitSpec from '#/unit/timetable/timetable.service.spec.js';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '@/app.module.js';
import '@/std.type.js';

describe('EtuUTT API unit testing', () => {
  let app: TestingModule;
  beforeAll(async () => {
    app = await Test.createTestingModule({ imports: [AppModule.register()] }).compile();
  });
  afterAll(async () => {
    await app.close();
  });
  TimetableServiceUnitSpec(() => app);
});
