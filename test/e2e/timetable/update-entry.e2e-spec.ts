import { e2eSuite } from '../../utils/test_utils';
import * as fakedb from '../../utils/fakedb';
import * as pactum from 'pactum';
import { HttpStatus } from '@nestjs/common';
import { uuid } from 'pactum-matchers';
import { faker } from '@faker-js/faker';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { createTimetableGroup } from '../../utils/fakedb';
import TimetableUpdateEntryDto from '../../../src/timetable/dto/timetable-update-entry.dto';

const UpdateEntryE2ESpec = e2eSuite('PATCH /timetable/current/:entryId', (app) => {
  const user = fakedb.createUser(app);
  const userGroup = fakedb.createTimetableGroup(app, { users: [{ user, priority: 1 }] });
  const userOtherGroup = fakedb.createTimetableGroup(app, { users: [{ user, priority: 1 }] });
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
  const dummyPayload = (overrides: Partial<TimetableUpdateEntryDto> = {}): TimetableUpdateEntryDto => ({
    location: "bet you can't find it",
    updateFrom: 0,
    updateUntil: 0,
    applyEvery: 1,
    for: [userGroup.id],
    ...overrides,
  });

  it('should fail as user is not authenticated', () =>
    pactum.spec().patch(`/timetable/current/aaa`).expectStatus(HttpStatus.UNAUTHORIZED));

  it('should fail as entry id is invalid', () =>
    pactum.spec().patch(`/timetable/current/aaa`).withBearerToken(user.token).expectStatus(HttpStatus.BAD_REQUEST));

  it('should fail as entry does not exist', () =>
    pactum
      .spec()
      .patch(`/timetable/current/${faker.datatype.uuid()}`)
      .withBearerToken(user.token)
      .withJson(dummyPayload())
      .expectStatus(HttpStatus.NOT_FOUND));

  it('should fail as entry does not belong to user', () =>
    pactum
      .spec()
      .patch(`/timetable/current/${otherEntry.id}`)
      .withBearerToken(user.token)
      .withJson(dummyPayload())
      .expectStatus(HttpStatus.NOT_FOUND));

  it('should fail as user is not in group', async () => {
    const emptyGroup = await createTimetableGroup(app, {}, true);
    await pactum
      .spec()
      .patch(`/timetable/current/${otherEntry.id}`)
      .withBearerToken(user.token)
      .withJson(dummyPayload({ for: [emptyGroup.id] }))
      .expectStatus(HttpStatus.NOT_FOUND);
  });

  it('should fail as we are trying to create an override with a group that is not in the entry', () =>
    pactum
      .spec()
      .patch(`/timetable/current/${entry.id}`)
      .withBearerToken(user.token)
      .withJson(dummyPayload({ for: [userGroup.id, userThirdGroup.id] }))
      .expectStatus(HttpStatus.CONFLICT));

  it('should update the whole entry', async () => {
    const newLocation = faker.address.cityName();
    await pactum
      .spec()
      .patch(`/timetable/current/${entry.id}`)
      .withBearerToken(user.token)
      .withJson({
        location: newLocation,
        updateFrom: 0,
        updateUntil: 2,
        applyEvery: 1,
        for: [userGroup.id, userOtherGroup.id],
      })
      .expectStatus(HttpStatus.OK)
      .expectJson({
        id: entry.id,
        location: newLocation,
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
            groups: [userOtherGroup.id, userGroup.id],
          },
        ],
      });
    entry.location = newLocation;
  });

  it('should create a new override because the modification is not applied to all occurrences', async () => {
    await pactum
      .spec()
      .patch(`/timetable/current/${entry.id}`)
      .withBearerToken(user.token)
      .withJson({
        location: 'Somewhere else',
        updateFrom: 0,
        updateUntil: 1,
        applyEvery: 1,
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
            location: 'Somewhere else',
            firstRepetitionDate: new Date(0).toISOString(),
            lastRepetitionDate: new Date(10).toISOString(),
            firstOccurrenceOverride: 0,
            lastOccurrenceOverride: 1,
            overrideFrequency: 1,
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
            groups: [userOtherGroup.id, userGroup.id],
          },
        ],
      });
    await app()
      .get(PrismaService)
      .timetableEntryOverride.deleteMany({ where: { NOT: { id: override.id } } });
  });

  it('should update the override', async () => {
    const newLocation = faker.address.cityName();
    await pactum
      .spec()
      .patch(`/timetable/current/${entry.id}`)
      .withBearerToken(user.token)
      .withJson({
        location: newLocation,
        updateFrom: 1,
        updateUntil: 2,
        applyEvery: 1,
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
            location: newLocation,
            firstRepetitionDate: new Date(10).toISOString(),
            lastRepetitionDate: new Date(20).toISOString(),
            firstOccurrenceOverride: 1,
            lastOccurrenceOverride: 2,
            overrideFrequency: 1,
            groups: [userOtherGroup.id, userGroup.id],
          },
        ],
      });
    override.location = newLocation;
  });

  it('should create a new override as they are not for the same groups', async () => {
    const newLocation = faker.address.cityName();
    await pactum
      .spec()
      .patch(`/timetable/current/${entry.id}`)
      .withBearerToken(user.token)
      .withJson({
        location: newLocation,
        updateFrom: 1,
        updateUntil: 2,
        applyEvery: 1,
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
            id: uuid(),
            location: newLocation,
            firstRepetitionDate: new Date(10).toISOString(),
            lastRepetitionDate: new Date(20).toISOString(),
            firstOccurrenceOverride: 1,
            lastOccurrenceOverride: 2,
            overrideFrequency: 1,
            groups: [userGroup.id],
          },
          {
            id: override.id,
            location: override.location,
            firstRepetitionDate: new Date(10).toISOString(),
            lastRepetitionDate: new Date(20).toISOString(),
            firstOccurrenceOverride: 1,
            lastOccurrenceOverride: 2,
            overrideFrequency: 1,
            groups: [userOtherGroup.id, userGroup.id],
          },
        ],
      });
    await app()
      .get(PrismaService)
      .timetableEntryOverride.deleteMany({ where: { NOT: { id: override.id } } });
  });
});

export default UpdateEntryE2ESpec;
