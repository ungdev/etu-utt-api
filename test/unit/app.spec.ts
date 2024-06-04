import TimetableServiceUnitSpec from './timetable/timetable.service.spec';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import '../../src/array';

describe('EtuUTT API unit testing', () => {
  let app: TestingModule;
  beforeAll(async () => {
    app = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });
  TimetableServiceUnitSpec(() => app);
});
