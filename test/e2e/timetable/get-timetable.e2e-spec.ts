import { e2eSuite } from '../../utils/test_utils';
import * as fakedb from '../../utils/fakedb';
import { HttpStatus } from '@nestjs/common';
import * as pactum from 'pactum';
import { createTimetableEntry, createTimetableGroup } from '../../utils/fakedb';

const GetTimetableE2ESpec = e2eSuite('GET /timetable/current/:daysCount/:day/:month/:year', (app) => {
  const user = fakedb.createUser(app);
  const group = createTimetableGroup(app, { users: [{ user, priority: 1 }] });
  const timetableEntry = createTimetableEntry(app, {
    eventStart: new Date(0),
    occurrencesCount: 3,
    repeatEvery: 24 * 3_600_000,
    occurrenceDuration: 1,
    groups: [group],
  });

  it('should fail as user is not authenticated', () =>
    pactum.spec().get('/timetable/current/2/1/2/3').expectStatus(HttpStatus.UNAUTHORIZED));

  it('should fail as the value passed are not numbers', () =>
    Promise.all([
      pactum
        .spec()
        .get('/timetable/current/yeahthatsanumber/1/2/3')
        .withBearerToken(user.token)
        .expectStatus(HttpStatus.BAD_REQUEST),
      pactum
        .spec()
        .get('/timetable/current/2/yeahthatsanumber/2/3')
        .withBearerToken(user.token)
        .expectStatus(HttpStatus.BAD_REQUEST),
      pactum
        .spec()
        .get('/timetable/current/2/1/yeahthatsanumber/3')
        .withBearerToken(user.token)
        .expectStatus(HttpStatus.BAD_REQUEST),
      pactum
        .spec()
        .get('/timetable/current/2/1/2/yeahthatsanumber')
        .withBearerToken(user.token)
        .expectStatus(HttpStatus.BAD_REQUEST),
    ]));

  it('should return the events in the next 2 days', async () => {
    const date = timetableEntry.eventStart.getDate();
    const month = timetableEntry.eventStart.getMonth() + 1;
    const year = timetableEntry.eventStart.getFullYear();
    return pactum
      .spec()
      .get(`/timetable/current/2/${date}/${month}/${year}`)
      .withBearerToken(user.token)
      .expectStatus(HttpStatus.OK)
      .expectJson([
        {
          id: `0@${timetableEntry.id}`,
          start: new Date(0).toISOString(),
          end: new Date(1).toISOString(),
          location: timetableEntry.location,
        },
        {
          id: `1@${timetableEntry.id}`,
          start: new Date(24 * 3_600_000).toISOString(),
          end: new Date(24 * 3_600_000 + 1).toISOString(),
          location: timetableEntry.location,
        },
      ]);
  });
});

export default GetTimetableE2ESpec;
