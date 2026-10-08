import TimetableServiceUnitSpec from '#/unit/timetable/timetable.service.spec.js';
import LexicalValidationUnitSpec from '#/unit/lexical/lexical-validation.spec.js';
import LexicalGenerationUnitSpec from '#/unit/lexical/lexical-generation.spec.js';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '@/app.module.js';
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
