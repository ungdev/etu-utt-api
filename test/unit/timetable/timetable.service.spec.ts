import TimetableService from '../../../src/timetable/timetable.service';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { RawTimetableEntry, RawTimetableEntryOverride, RawTimetableGroup, RawUser } from '../../../src/prisma/types';
import { AppModule } from '../../../src/app.module';

const TimetableServiceUnitSpec = () =>
  describe('Timetable.service', () => {
    let timetableService: TimetableService;
    let prisma: PrismaService;
    let user1: RawUser;
    let user2: RawUser;
    let everyoneGroup: RawTimetableGroup;
    let user1Group: RawTimetableGroup;
    // for everyoneGroup
    let entry: RawTimetableEntry;
    // for user1Group
    let overrideEntry: RawTimetableEntryOverride;
    // for user1Group
    let shorterOverrideEntry: RawTimetableEntry;

    beforeAll(async () => {
      const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
      timetableService = module.get(TimetableService);
      prisma = module.get(PrismaService);
      everyoneGroup = await prisma.timetableGroup.create({ data: { name: 'primary' } });
      user1Group = await prisma.timetableGroup.create({ data: { name: 'override' } });
      user1 = await prisma.user.create({
        data: {
          login: randomStringGenerator(),
          hash: 'strongpasswordhash',
          firstName: 'Mario',
          lastName: 'undefined',
          userTimetableGroup: {
            create: [
              { timetableGroup: { connect: everyoneGroup }, priority: 1 },
              { timetableGroup: { connect: user1Group }, priority: 2 },
            ],
          },
        },
      });
      user2 = await prisma.user.create({
        data: {
          login: randomStringGenerator(),
          hash: 'trytofindapasswordthathashestothat:)',
          firstName: 'Luigi',
          lastName: 'undefined',
          userTimetableGroup: {
            create: {
              timetableGroup: { connect: everyoneGroup },
              priority: 1,
            },
          },
        },
      });
      entry = await prisma.timetableEntry.create({
        data: {
          eventStart: new Date(0),
          occurrencesCount: 4,
          repeatEvery: 3_600_000,
          occurrenceDuration: 1_000_000,
          type: 'CUSTOM',
          location: 'At a very random place',
          timetableGroup: { connect: everyoneGroup },
        },
      });
      overrideEntry = await prisma.timetableEntryOverride.create({
        data: {
          applyFrom: 0,
          applyUntil: 0,
          location: 'Another random place',
          timetableGroup: { connect: user1Group },
          overrideTimetableEntry: { connect: entry },
        },
      });
    });

    it('should return the entry', async () => {
      const timetable = await timetableService.getTimetableOfUserInNextXMs(user2.id, new Date(3_600_000), 8_000_000);
      expect(timetable).toHaveLength(3);
      for (const occurrence of timetable) {
        expect(occurrence.entryId).toEqual(entry.id);
        expect([3_600_000, 7_200_000, 10_800_000]).toContain(
          timetable[0].start.getTime() - entry.eventStart.getTime(),
        );
      }
    });

    it('should create an event only for user 1', async () => {
      const otherEntry = await prisma.timetableEntry.create({
        data: {
          eventStart: new Date(0),
          occurrencesCount: 1,
          occurrenceDuration: 10,
          type: 'CUSTOM',
          location: 'Same place as the other event',
          timetableGroup: { connect: user1Group },
        },
      });
      let timetable = await timetableService.getTimetableOfUserInNextXMs(user1.id, new Date(0), 1);
      expect(timetable).toHaveLength(2);
      timetable = await timetableService.getTimetableOfUserInNextXMs(user2.id, new Date(0), 1);
      expect(timetable).toHaveLength(1);
      await prisma.timetableEntry.delete({where: otherEntry});
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

    it('should return an for user2 but not user1, as the priority of this new override is smaller than the one for user1', async () => {
      const lessImportantOverride = await prisma.timetableEntryOverride.create({
        data: {
          applyFrom: 0,
          applyUntil: 0,
          timetableGroup: { connect: everyoneGroup },
          overrideTimetableEntry: { connect: entry },
          location: 'Petaouchnok',
        },
      });
      // user 1 : we should still get the override overrideEntry
      let timetable = await timetableService.getTimetableOfUserInNextXMs(user1.id, new Date(0), 1);
      expect(timetable).toHaveLength(1);
      expect(timetable[0].entryId).toEqual(overrideEntry.id);
      // user2 : we should get the newly created lessImportantOverride
      timetable = await timetableService.getTimetableOfUserInNextXMs(user2.id, new Date(0), 1);
      expect(timetable).toHaveLength(1);
      expect(timetable[0].entryId).toEqual(lessImportantOverride.id);
      await prisma.timetableEntryOverride.delete({ where: lessImportantOverride });
    });

    it('should have priority over the existing override of user 1, as the new override will be newer', async () => {
      const newerOverride = await prisma.timetableEntryOverride.create({
        data: {
          applyFrom: 0,
          applyUntil: 0,
          location: 'Schtroumpf',
          timetableGroup: { connect: user1Group },
          overrideTimetableEntry: {connect: entry},
        },
      });
      const timetable = await timetableService.getTimetableOfUserInNextXMs(user1.id, new Date(0), 1);
      expect(timetable).toHaveLength(1);
      expect(timetable[0].location).toEqual(newerOverride.location);
      await prisma.timetableEntryOverride.delete({ where: newerOverride });
    });
  });

export default TimetableServiceUnitSpec;
