import { e2eSuite } from '../../utils/test_utils';
import * as pactum from 'pactum';
import { ERROR_CODE } from '../../../src/exceptions';
import * as fakedb from '../../utils/fakedb';
import { regex } from '../../../src/app.pipe';

const GetEntryDetailsE2ESpec = e2eSuite('GET /timetable/:entryId', (app) => {
  const user1 = fakedb.createUser(app);
  const user2 = fakedb.createUser(app);
  const user1Group = fakedb.createTimetableGroup(app, { users: [{ user: user1, priority: 1 }] });
  const user1OtherGroup = fakedb.createTimetableGroup(app, { users: [{ user: user1, priority: 2 }] });
  const user2Group = fakedb.createTimetableGroup(app, { users: [{ user: user2, priority: 1 }] });
  const entry = fakedb.createTimetableEntry(app, { groups: [user1Group] });
  const override1 = fakedb.createTimetableEntryOverride(app, { entry }, { groups: [user1Group] });
  const override2 = fakedb.createTimetableEntryOverride(app, { entry }, { groups: [user1OtherGroup] });
  // Create an override not for user1
  fakedb.createTimetableEntryOverride(app, { entry }, { groups: [user2Group] });

  let entryDetails: object;

  beforeAll(() => {
    entryDetails = {
      id: entry.id,
      location: entry.location,
      duration: entry.occurrenceDuration,
      firstRepetitionDate: entry.eventStart,
      lastRepetitionDate: new Date(entry.eventStart.getTime() + (entry.occurrencesCount - 1) * entry.repeatEvery),
      repetitionFrequency: entry.repeatEvery,
      repetitions: entry.occurrencesCount,
      groups: [user1Group.id],
      overrides: [
        {
          id: override2.id,
          location: override2.location,
          firstRepetitionDate: entry.eventStart,
          lastRepetitionDate: entry.eventStart,
          firstOccurrenceOverride: override2.applyFrom,
          lastOccurrenceOverride: override2.applyUntil,
          overrideFrequency: override2.repeatEvery,
          deletion: false,
          groups: [user1OtherGroup.id],
        },
        {
          id: override1.id,
          location: override1.location,
          firstRepetitionDate: entry.eventStart,
          lastRepetitionDate: entry.eventStart,
          firstOccurrenceOverride: override1.applyFrom,
          lastOccurrenceOverride: override1.applyUntil,
          overrideFrequency: override1.repeatEvery,
          deletion: false,
          groups: [user1Group.id],
        },
      ],
    };
  });

  it('should fail as we are not connected', () =>
    pactum.spec().get('/timetable/abc').expectAppError(ERROR_CODE.NOT_LOGGED_IN));

  it('should fail as the format of the id is not correct', () =>
    pactum
      .spec()
      .get(`/timetable/abc`)
      .withBearerToken(user2.token)
      .expectAppError(ERROR_CODE.PARAM_DOES_NOT_MATCH_REGEX, regex.timetableOccurrenceId.toString(), 'entryId'));

  it('should fail as entry was not found', () =>
    pactum
      .spec()
      .get('/timetable/012@01234567-0123-0123-0123-0123456789ab')
      .withBearerToken(user1.token)
      .expectAppError(ERROR_CODE.NO_SUCH_TIMETABLE_ENTRY, '01234567-0123-0123-0123-0123456789ab'));

  it('should fail as the entry does not concern the user', () =>
    pactum
      .spec()
      .get(`/timetable/0@${entry.id}`)
      .withBearerToken(user2.token)
      .expectAppError(ERROR_CODE.NO_SUCH_TIMETABLE_ENTRY, entry.id));

  it('should fail as the override does not concern the user', () =>
    pactum
      .spec()
      .get(`/timetable/0@${override1.id}`)
      .withBearerToken(user2.token)
      .expectAppError(ERROR_CODE.NO_SUCH_TIMETABLE_ENTRY, override1.id));

  it('should return the details of the entry', () =>
    pactum.spec().get(`/timetable/0@${entry.id}`).withBearerToken(user1.token).$expectRegexableJson(entryDetails));

  it('should return the details of the entry, which is an override', () =>
    pactum.spec().get(`/timetable/0@${override1.id}`).withBearerToken(user1.token).$expectRegexableJson(entryDetails));
});

export default GetEntryDetailsE2ESpec;
