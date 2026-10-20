import { describe, beforeAll, afterAll, vi } from 'vitest';

// Ejs adapter should not be imported in a test environment (it lets hanging promises and things like this, + anyway we don't need it)
vi.mock('@nestjs-modules/mailer/dist/adapters/ejs.adapter', () => ({
  EjsAdapter: vi.fn(class {
    constructor() {}
    compile = vi.fn()
  })
}));

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
