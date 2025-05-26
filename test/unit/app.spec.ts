import TimetableServiceUnitSpec from './timetable/timetable.service.spec';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import '../../src/std.type';

/*
 * Unit testing is currently DISABLED. Remove the .skip in the line below
 */
describe.skip('EtuUTT API unit testing', () => {
  let app: TestingModule;
  beforeAll(async () => {
    app = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });
  TimetableServiceUnitSpec(() => app);
});
