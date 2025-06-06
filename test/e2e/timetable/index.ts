import { E2EAppProvider } from '../../utils/test_utils';
import GetDailyTimetableE2ESpec from './get-daily-timetable-e2e-spec';
import GetTimetableE2ESpec from './get-timetable.e2e-spec';
import GetGroupsE2ESpec from './get-groups.e2e-spec';
import GetEntryDetailsE2ESpec from './get-entry-details.e2e-spec';
import CreateEntryE2ESpec from './create-entry.e2e-spec';
import UpdateEntryE2ESpec from './update-entry.e2e-spec';
import DeleteEntryE2ESpec from './delete-occurrences.e2e-spec';
import ImportTimetableE2ESpec from './import-timetable.e2e-spec';

// These tests are deactivated by describe.skip
export default function TimetableE2ESpec(app: E2EAppProvider) {
  describe.skip('Timetable', () => {
    GetDailyTimetableE2ESpec(app);
    GetTimetableE2ESpec(app);
    GetGroupsE2ESpec(app);
    GetEntryDetailsE2ESpec(app);
    CreateEntryE2ESpec(app);
    UpdateEntryE2ESpec(app);
    DeleteEntryE2ESpec(app);
    ImportTimetableE2ESpec(app);
  });
}
