import { E2EAppProvider } from '../../utils/test_utils';
import GetDailyTimetableE2ESpec from './get-daily-timetable-e2e-spec';
import GetGroupsE2ESpec from './get-groups.e2e-spec';
import GetEntryDetailsE2ESpec from './get-entry-details.e2e-spec';
import CreateEntryE2ESpec from './create-entry.e2e-spec';

export default function TimetableE2ESpec(app: E2EAppProvider) {
  describe('Timetable', () => {
    GetDailyTimetableE2ESpec(app);
    GetGroupsE2ESpec(app);
    GetEntryDetailsE2ESpec(app);
    CreateEntryE2ESpec(app);
  });
}
