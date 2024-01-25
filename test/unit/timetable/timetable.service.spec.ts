import TimetableService from '../../../src/timetable/timetable.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { unitSuite } from '../../utils/test_utils';
import * as fakedb from '../../utils/fakedb';
import { createTimetableEntry, createTimetableEntryOverride } from '../../utils/fakedb';
import { faker } from '@faker-js/faker';

const TimetableServiceUnitSpec = unitSuite('Timetable.service', (app) => {
  let timetableService: TimetableService;
  let prisma: PrismaService;
  const user1 = fakedb.createUser(app);
  const user2 = fakedb.createUser(app);
  const everyoneGroup = fakedb.createTimetableGroup(app, {
    users: [
      { user: user1, priority: 1 },
      { user: user2, priority: 1 },
    ],
  });
  const user1Group = fakedb.createTimetableGroup(app, { users: [{ user: user1, priority: 2 }] });
  const entry = createTimetableEntry(app, {
    groups: [everyoneGroup],
    repeatEvery: 3_600_000,
    occurrenceDuration: 1_000_000,
    occurrencesCount: 4,
    eventStart: new Date(0),
  }); // for everyone
  const overrideEntry = createTimetableEntryOverride(
    app,
    { entry },
    {
      groups: [user1Group],
      applyFrom: 0,
      applyUntil: 0,
      location: faker.address.cityName(),
    },
  ); // for user 1

  beforeAll(() => {
    timetableService = app().get(TimetableService);
    prisma = app().get(PrismaService);
  });

  it('should return the entry', async () => {
    const timetable = await timetableService.getTimetableOfUserInNextXMs(user2.id, new Date(3_600_000), 8_000_000);
    expect(timetable).toHaveLength(3);
    for (const occurrence of timetable) {
      expect(occurrence.entryId).toEqual(entry.id);
      expect([3_600_000, 7_200_000, 10_800_000]).toContain(timetable[0].start.getTime() - entry.eventStart.getTime());
    }
  });

  it('should create an event only for user 1', async () => {
    const otherEntry = await createTimetableEntry(
      app,
      {
        groups: [user1Group],
        occurrencesCount: 10,
        occurrenceDuration: 10,
        eventStart: new Date(0),
        repeatEvery: 1_000_000,
      },
      true,
    );
    let timetable = await timetableService.getTimetableOfUserInNextXMs(user1.id, new Date(0), 1);
    expect(timetable).toHaveLength(2);
    timetable = await timetableService.getTimetableOfUserInNextXMs(user2.id, new Date(0), 1);
    expect(timetable).toHaveLength(1);
    await prisma.timetableEntry.delete({ where: { id: otherEntry.id } });
  });

  it('should return the primary entry with an override for user1', async () => {
    const timetable = await timetableService.getTimetableOfUserInNextXMs(user1.id, new Date(0), 3_600_001);
    expect(timetable).toHaveLength(2);
    const indexOfOverwritten = timetable.findIndex((occurrence) => occurrence.entryId === overrideEntry.id);
    expect(indexOfOverwritten).not.toEqual(-1);
    const indexOfDefault = indexOfOverwritten === 0 ? 1 : 0;
    expect(timetable[indexOfOverwritten].index).toEqual(0);
    expect(timetable[indexOfOverwritten].location).toEqual(overrideEntry.location);
    expect(timetable[indexOfDefault].entryId).toEqual(entry.id);
    expect(timetable[indexOfDefault].index).toEqual(1);
    expect(timetable[indexOfDefault].location).toEqual(entry.location);
  });

  it('should return an occurrence of a new override for user2 but not user1, as the priority of this new override is smaller than the one for user1', async () => {
    const lessImportantOverride = await fakedb.createTimetableEntryOverride(
      app,
      { entry },
      { groups: [everyoneGroup], applyFrom: 0, applyUntil: 0 },
      true,
    );
    // user 1 : we should still get the override overrideEntry
    let timetable = await timetableService.getTimetableOfUserInNextXMs(user1.id, new Date(0), 1);
    expect(timetable).toHaveLength(1);
    expect(timetable[0].entryId).toEqual(overrideEntry.id);
    // user2 : we should get the newly created lessImportantOverride
    timetable = await timetableService.getTimetableOfUserInNextXMs(user2.id, new Date(0), 1);
    expect(timetable).toHaveLength(1);
    expect(timetable[0].entryId).toEqual(lessImportantOverride.id);
    await prisma.timetableEntryOverride.delete({ where: { id: lessImportantOverride.id } });
  });

  it('should have priority over the existing override of user 1, as the new override will be newer', async () => {
    const newerOverride = await fakedb.createTimetableEntryOverride(
      app,
      { entry },
      { groups: [user1Group], applyFrom: 0, applyUntil: 0, location: faker.address.cityName() },
      true,
    );
    const timetable = await timetableService.getTimetableOfUserInNextXMs(user1.id, new Date(0), 1);
    expect(timetable).toHaveLength(1);
    expect(timetable[0].location).toEqual(newerOverride.location);
    await prisma.timetableEntryOverride.delete({ where: { id: newerOverride.id } });
  });
});

export default TimetableServiceUnitSpec;
