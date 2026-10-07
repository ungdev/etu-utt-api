import TimetableServiceUnitSpec from '#/unit/timetable/timetable.service.spec';
import LexicalValidationUnitSpec from '#/unit/lexical/lexical-validation.spec';
import LexicalGenerationUnitSpec from '#/unit/lexical/lexical-generation.spec';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '@/app.module';
import '@/std.type';
import { afterAll, beforeAll, describe } from 'vitest';

describe('EtuUTT API unit testing', () => {
  let app: TestingModule;
  beforeAll(async () => {
    app = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });
  afterAll(async () => {
    await app.close();
  });
  TimetableServiceUnitSpec(() => app);
  LexicalValidationUnitSpec(() => app);
  LexicalGenerationUnitSpec(() => app);
});
