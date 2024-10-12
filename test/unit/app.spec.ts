//import TimetableServiceUnitSpec from './timetable/timetable.service.spec';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import '../../src/std.type';

describe('EtuUTT API unit testing', () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let app: TestingModule;
  beforeAll(async () => {
    app = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });
  //TimetableServiceUnitSpec(() => app);
});
