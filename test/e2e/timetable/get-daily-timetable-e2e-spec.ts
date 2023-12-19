import { e2eSuite } from '../../utils/test_utils';
import * as fakedb from '../../utils/fakedb';
import { HttpStatus } from '@nestjs/common';
import { RawTimetableEntry } from '../../../src/prisma/types';
import { PrismaService } from '../../../src/prisma/prisma.service';
import * as pactum from 'pactum';

const GetDailyTimetableE2ESpec = e2eSuite('GET /timetable/current/daily/:day/:month/:year', (app) => {
  const user = fakedb.createUser(app);
  let timetableEntry: RawTimetableEntry;

  beforeAll(async () => {
    timetableEntry = await app()
      .get(PrismaService)
      .timetableEntry.create({
        data: {
          eventStart: new Date(0),
          occurrencesCount: 2,
          repeatEvery: 12 * 3_600_000,
          occurrenceDuration: 3_600_000,
          type: 'CUSTOM',
          location: 'The surimi operation center',
          timetableGroup: {
            create: { name: 'user group', userTimetableGroups: { create: { priority: 1, userId: user.id } } },
          },
        },
      });
  });

  it('should fail as user is not authenticated', () =>
    pactum.spec().get('/timetable/current/daily/1/2/3').expectStatus(HttpStatus.UNAUTHORIZED));

  it('should fail as the value passed are not numbers', () =>
    Promise.all([
      pactum
        .spec()
        .get('/timetable/current/daily/unnombre/2/3')
        .withBearerToken(user.token)
        .expectStatus(HttpStatus.BAD_REQUEST),
      pactum
        .spec()
        .get('/timetable/current/daily/1/unnombre/3')
        .withBearerToken(user.token)
        .expectStatus(HttpStatus.BAD_REQUEST),
      pactum
        .spec()
        .get('/timetable/current/daily/1/2/unnombre')
        .withBearerToken(user.token)
        .expectStatus(HttpStatus.BAD_REQUEST),
    ]));

  it('should return the events of the day', async () => {
    const date = timetableEntry.eventStart.getDate();
    const month = timetableEntry.eventStart.getMonth() + 1;
    const year = timetableEntry.eventStart.getFullYear();
    return pactum
      .spec()
      .get(`/timetable/current/daily/${date}/${month}/${year}`)
      .withBearerToken(user.token)
      .expectStatus(HttpStatus.OK)
      .expectJson([
        {
          id: `0@${timetableEntry.id}`,
          start: new Date(0).toISOString(),
          end: new Date(3_600_000).toISOString(),
          location: timetableEntry.location,
        },
        {
          id: `1@${timetableEntry.id}`,
          start: new Date(12 * 3_600_000).toISOString(),
          end: new Date(13 * 3_600_000).toISOString(),
          location: timetableEntry.location,
        },
      ]);
  });
});

export default GetDailyTimetableE2ESpec;
