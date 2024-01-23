import { e2eSuite } from '../../utils/test_utils';
import * as fakedb from '../../utils/fakedb';
import * as pactum from 'pactum';
import { HttpStatus } from '@nestjs/common';
import { uuid } from 'pactum-matchers';
import { faker } from '@faker-js/faker';
import { PrismaService } from '../../../src/prisma/prisma.service';
import TimetableDeleteOccurrencesDto from '../../../src/timetable/dto/timetable-delete-occurrences.dto';

const DeleteEntryE2ESpec = e2eSuite('DELETE /timetable/current/:entryId', (app) => {
  const user = fakedb.createUser(app);
  const userGroup = fakedb.createTimetableGroup(app, { users: [{ user, priority: 1 }] });
  const userOtherGroup = fakedb.createTimetableGroup(app, { users: [{ user, priority: 2 }] });
  const userThirdGroup = fakedb.createTimetableGroup(app, { users: [{ user, priority: 1 }] });
  const entry = fakedb.createTimetableEntry(app, {
    groups: [userGroup, userOtherGroup],
    occurrencesCount: 3,
    repeatEvery: 10,
  });
  const override = fakedb.createTimetableEntryOverride(app, entry, {
    applyFrom: 1,
    applyUntil: 2,
    repeatEvery: 1,
    groups: [userGroup, userOtherGroup],
  });
  const otherEntry = fakedb.createTimetableEntry(app);
  const dummyPayload = (overrides: Partial<TimetableDeleteOccurrencesDto> = {}): TimetableDeleteOccurrencesDto => ({
    from: 0,
    until: 0,
    every: 1,
    for: [userGroup.id],
    ...overrides,
  });

  it('should fail as user is not authenticated', () =>
    pactum.spec().delete(`/timetable/current/aaa`).expectStatus(HttpStatus.UNAUTHORIZED));

  it('should fail as entry id is invalid', () =>
    pactum.spec().delete(`/timetable/current/aaa`).withBearerToken(user.token).expectStatus(HttpStatus.BAD_REQUEST));

  it('should fail as entry does not exist', () =>
    pactum
      .spec()
      .delete(`/timetable/current/${faker.datatype.uuid()}`)
      .withBearerToken(user.token)
      .withJson(dummyPayload())
      .expectStatus(HttpStatus.NOT_FOUND));

  it('should fail as entry does not belong to user', () =>
    pactum
      .spec()
      .delete(`/timetable/current/${otherEntry.id}`)
      .withBearerToken(user.token)
      .withJson(dummyPayload())
      .expectStatus(HttpStatus.NOT_FOUND));

  it('should fail as user is not in group', async () => {
    const emptyGroup = await fakedb.createTimetableGroup(app, {}, true);
    await pactum
      .spec()
      .delete(`/timetable/current/${otherEntry.id}`)
      .withBearerToken(user.token)
      .withJson(dummyPayload({ for: [emptyGroup.id] }))
      .expectStatus(HttpStatus.NOT_FOUND);
  });

  it('should fail as we are trying to delete an occurrence for a group the user is not in', () =>
    pactum
      .spec()
      .delete(`/timetable/current/${entry.id}`)
      .withBearerToken(user.token)
      .withJson(dummyPayload({ for: [userGroup.id, userThirdGroup.id] }))
      .expectStatus(HttpStatus.CONFLICT));

  it('should delete the whole entry', async () => {
    await pactum
      .spec()
      .delete(`/timetable/current/${entry.id}`)
      .withBearerToken(user.token)
      .withJson({
        from: 0,
        until: 2,
        every: 1,
        for: [userGroup.id, userOtherGroup.id],
      })
      .expectStatus(HttpStatus.OK)
      .expectJson({
        id: entry.id,
        location: entry.location,
        duration: entry.occurrenceDuration,
        firstRepetitionDate: new Date(0).toISOString(),
        lastRepetitionDate: new Date(20).toISOString(),
        repetitionFrequency: 10,
        repetitions: 3,
        groups: [userOtherGroup.id, userGroup.id],
        overrides: [
          {
            id: override.id,
            location: override.location,
            firstRepetitionDate: new Date(10).toISOString(),
            lastRepetitionDate: new Date(20).toISOString(),
            firstOccurrenceOverride: 1,
            lastOccurrenceOverride: 2,
            overrideFrequency: 1,
            deletion: false,
            groups: [userOtherGroup.id, userGroup.id],
          },
        ],
      });
    await fakedb.createTimetableEntry(app, { ...entry, groups: [userGroup, userOtherGroup] }, true);
    await fakedb.createTimetableEntryOverride(app, entry, { ...override, groups: [userGroup, userOtherGroup] }, true);
  });

  it('should convert the override to a deletion type', async () => {
    await pactum
      .spec()
      .delete(`/timetable/current/${entry.id}`)
      .withBearerToken(user.token)
      .withJson({
        from: 1,
        until: 2,
        every: 1,
        for: [userGroup.id, userOtherGroup.id],
      })
      .expectStatus(HttpStatus.OK)
      .expectJson({
        id: entry.id,
        location: entry.location,
        duration: entry.occurrenceDuration,
        firstRepetitionDate: new Date(0).toISOString(),
        lastRepetitionDate: new Date(20).toISOString(),
        repetitionFrequency: 10,
        repetitions: 3,
        groups: [userOtherGroup.id, userGroup.id],
        overrides: [
          {
            id: override.id,
            firstRepetitionDate: new Date(10).toISOString(),
            lastRepetitionDate: new Date(20).toISOString(),
            firstOccurrenceOverride: 1,
            lastOccurrenceOverride: 2,
            overrideFrequency: 1,
            deletion: true,
            location: null,
            groups: [userOtherGroup.id, userGroup.id],
          },
        ],
      });
    await app()
      .get(PrismaService)
      .timetableEntryOverride.update({ where: { id: override.id }, data: override });
  });

  it('should create a new override because the deletion is not applied to all occurrences', async () => {
    await pactum
      .spec()
      .delete(`/timetable/current/${entry.id}`)
      .withBearerToken(user.token)
      .withJson({
        from: 0,
        until: 1,
        every: 1,
        for: [userGroup.id, userOtherGroup.id],
      })
      .expectStatus(HttpStatus.OK)
      .expectJsonMatchStrict({
        id: entry.id,
        location: entry.location,
        duration: entry.occurrenceDuration,
        firstRepetitionDate: new Date(0).toISOString(),
        lastRepetitionDate: new Date(20).toISOString(),
        repetitionFrequency: 10,
        repetitions: 3,
        groups: [userOtherGroup.id, userGroup.id],
        overrides: [
          {
            id: uuid(),
            location: null,
            firstRepetitionDate: new Date(0).toISOString(),
            lastRepetitionDate: new Date(10).toISOString(),
            firstOccurrenceOverride: 0,
            lastOccurrenceOverride: 1,
            overrideFrequency: 1,
            deletion: true,
            groups: [userOtherGroup.id, userGroup.id],
          },
          {
            id: override.id,
            location: override.location,
            firstRepetitionDate: new Date(10).toISOString(),
            lastRepetitionDate: new Date(20).toISOString(),
            firstOccurrenceOverride: 1,
            lastOccurrenceOverride: 2,
            overrideFrequency: 1,
            deletion: false,
            groups: [userOtherGroup.id, userGroup.id],
          },
        ],
      });
    await app()
      .get(PrismaService)
      .timetableEntryOverride.deleteMany({ where: { NOT: { id: override.id } } });
  });

  it('should create a new override as they are not for the same groups', async () => {
    await pactum
      .spec()
      .delete(`/timetable/current/${entry.id}`)
      .withBearerToken(user.token)
      .withJson({
        from: 1,
        until: 2,
        every: 1,
        for: [userGroup.id],
      })
      .expectStatus(HttpStatus.OK)
      .expectJsonMatchStrict({
        id: entry.id,
        location: entry.location,
        duration: entry.occurrenceDuration,
        firstRepetitionDate: new Date(0).toISOString(),
        lastRepetitionDate: new Date(20).toISOString(),
        repetitionFrequency: 10,
        repetitions: 3,
        groups: [userOtherGroup.id, userGroup.id],
        overrides: [
          {
            id: override.id,
            location: override.location,
            firstRepetitionDate: new Date(10).toISOString(),
            lastRepetitionDate: new Date(20).toISOString(),
            firstOccurrenceOverride: 1,
            lastOccurrenceOverride: 2,
            overrideFrequency: 1,
            deletion: false,
            groups: [userOtherGroup.id, userGroup.id],
          },
          {
            id: uuid(),
            location: null,
            firstRepetitionDate: new Date(10).toISOString(),
            lastRepetitionDate: new Date(20).toISOString(),
            firstOccurrenceOverride: 1,
            lastOccurrenceOverride: 2,
            overrideFrequency: 1,
            deletion: true,
            groups: [userGroup.id],
          },
        ],
      });
    await app()
      .get(PrismaService)
      .timetableEntryOverride.deleteMany({ where: { NOT: { id: override.id } } });
  });
});

export default DeleteEntryE2ESpec;
