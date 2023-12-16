import TimetableService from '../../../src/timetable/timetable.service';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import {RawTimetableEntry, RawTimetableEntryOverride, RawTimetableGroup, RawUser} from '../../../src/prisma/types';
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
    let primaryEntry: RawTimetableEntry;
    // for user1Group
    let overrideEntry: RawTimetableEntryOverride;
    // for everyoneGroup
    let lessImportantOverrideEntry: RawTimetableEntry;
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
      primaryEntry = await prisma.timetableEntry.create({
        data: {
          eventStart: new Date(Date.now() - 3_601_000),
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
          overrideTimetableEntry: {connect: primaryEntry},
        },
      });
    });

    it('should return the primary entry', async () => {
      const timetable = await timetableService.getTimetableOfUserInNextXMs(user2.id, new Date(), 8_000_000);
      expect(timetable).toHaveLength(3);
      for (const occurrence of timetable) {
          expect(occurrence.entryId).toEqual(primaryEntry.id);
          expect([3_600_000, 7_200_000, 9_800_000]).toContain(timetable[0].start.getTime() - primaryEntry.eventStart.getTime());
      }
    });

    it('should return the primary entry with an override for user1', async () => {
      const timetable = await timetableService.getTimetableOfUserInNextXMs(user1.id, new Date(Date.now() - 3_600_00), 3_600_000);
      expect(timetable).toHaveLength(2);
      const indexOfOverwritten = timetable.findIndex((occurrence) => occurrence.entryId === overrideEntry.id);
      expect(indexOfOverwritten).not.toEqual(-1);
      const indexOfDefault = indexOfOverwritten === 0 ? 1 : 0;
      expect(timetable[indexOfOverwritten].index).toEqual(0);
      expect(timetable[indexOfOverwritten].location).toEqual(overrideEntry.location);
      expect(timetable[indexOfDefault].entryId).toEqual(primaryEntry.id);
      expect(timetable[indexOfDefault].index).toEqual(1);
      expect(timetable[indexOfDefault].location).toEqual(primaryEntry.location);
    });
    /*overrideEntry = await prisma.timetableEntry.create({
      data: {
        eventStart: new Date(Date.now() - 3601),
        eventEnd: new Date(Date.now() - 8000),
        type: 'CUSTOM',
        location: 'Another random place',
        timetableGroup: { connect: user1Group },
      },
    });
    lessImportantOverrideEntry = await prisma.timetableEntry.create({
      data: {
        eventStart: new Date(Date.now()),
        eventEnd: new Date(Date.now()),
        timetableGroup: { connect: everyoneGroup },
      },
    });
    shorterOverrideEntry = await prisma.timetableEntry.create({
      data: {
        eventStart: new Date(Date.now()),
        eventEnd: new Date(Date.now()),
        timetableGroup: { connect: user1Group },
      },
    });*/
  });

export default TimetableServiceUnitSpec;
