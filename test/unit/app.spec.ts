// Ejs adapter should not be imported in a test environment (it lets hanging promises and things like this, + anyway we don't need it)
jest.mock('@nestjs-modules/mailer/dist/adapters/ejs.adapter', () => ({
  EjsAdapter: jest.fn().mockImplementation(() => ({
    compile: jest.fn(),
  })),
}));

import TimetableServiceUnitSpec from './timetable/timetable.service.spec';
import LexicalValidationUnitSpec from './lexical/lexical-validation.spec';
import LexicalGenerationUnitSpec from './lexical/lexical-generation.spec';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import '../../src/std.type';

describe('EtuUTT API unit testing', () => {
  let app: TestingModule;
  beforeAll(async () => {
    app = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });
  afterAll(async () => {
    await app.close();
  })
  TimetableServiceUnitSpec(() => app);
  LexicalValidationUnitSpec(() => app);
  LexicalGenerationUnitSpec(() => app);
});
