import { E2EAppProvider } from '../../test_utils';
import GetDailyTimetableE2ESpec from './get-daily-timetable-e2e-spec';

export default function TimetableE2ESpec(app: E2EAppProvider) {
  describe('Timetable', () => {
    GetDailyTimetableE2ESpec(app);
  });
}
