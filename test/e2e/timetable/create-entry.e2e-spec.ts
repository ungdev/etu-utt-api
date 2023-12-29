import { e2eSuite } from '../../utils/test_utils';
import * as fakedb from '../../utils/fakedb';
import * as pactum from 'pactum';
import { HttpStatus } from '@nestjs/common';
import { uuid } from 'pactum-matchers';

const CreateEntryE2ESpec = e2eSuite('POST /timetable/current', (app) => {
  const user = fakedb.createUser(app);
  const userGroup = fakedb.createTimetableGroup(app, { user, priority: 0 });

  it('should fail as user is not authenticated', () =>
    pactum.spec().post('/timetable/current').expectStatus(HttpStatus.UNAUTHORIZED));

  it('should fail as body is not valid', () =>
    pactum.spec().post('/timetable/current').withBearerToken(user.token).withBody({}));

  it('should successfully create a timetable entry', async () => {
    await pactum
      .spec()
      .post('/timetable/current')
      .withBearerToken(user.token)
      .withJson({
        location: 'In the test ig ?',
        duration: 3,
        firstRepetitionDate: new Date(0).toISOString(),
        repetitionFrequency: 10,
        repetitions: 4,
        groups: [userGroup.id],
      })
      .expectStatus(HttpStatus.CREATED)
      .expectJsonMatchStrict({
        id: uuid(),
        location: 'In the test ig ?',
        duration: 3,
        firstRepetitionDate: new Date(0).toISOString(),
        lastRepetitionDate: new Date(30).toISOString(),
        repetitionFrequency: 10,
        repetitions: 4,
        groups: [userGroup.id],
        overrides: [],
      });
  });
});

export default CreateEntryE2ESpec;
