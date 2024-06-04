import { e2eSuite } from '../../utils/test_utils';
import * as fakedb from '../../utils/fakedb';
import * as pactum from 'pactum';
import { HttpStatus } from '@nestjs/common';

const GetGroupsE2ESpec = e2eSuite('GET /timetable/current/groups', (app) => {
  const user1 = fakedb.createUser(app);
  const user2 = fakedb.createUser(app);
  const user1Group = fakedb.createTimetableGroup(app, { users: [{ user: user1, priority: 2 }] });
  // Create a group for user2
  fakedb.createTimetableGroup(app, { users: [{ user: user2, priority: 1 }] });
  const user1And2Group = fakedb.createTimetableGroup(app, {
    users: [
      { user: user1, priority: 1 },
      { user: user2, priority: 1 },
    ],
  });

  it('should fail as user is not connected', () =>
    pactum.spec().get('/timetable/current/groups').expectStatus(HttpStatus.UNAUTHORIZED));

  it('should return a list containing the groups of the user', () =>
    pactum
      .spec()
      .get('/timetable/current/groups')
      .withBearerToken(user1.token)
      .expectStatus(HttpStatus.OK)
      .expectJsonMatchStrict([
        { id: user1And2Group.id, name: user1And2Group.name, priority: 1 },
        { id: user1Group.id, name: user1Group.name, priority: 2 },
      ]));
});

export default GetGroupsE2ESpec;
