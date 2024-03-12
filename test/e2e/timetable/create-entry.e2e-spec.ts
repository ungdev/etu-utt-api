import { Dummies, e2eSuite } from '../../utils/test_utils';
import * as fakedb from '../../utils/fakedb';
import * as pactum from 'pactum';
import { HttpStatus } from '@nestjs/common';
import { uuid } from 'pactum-matchers';
import { ERROR_CODE } from '../../../src/exceptions';

const CreateEntryE2ESpec = e2eSuite('POST /timetable/current', (app) => {
  const user = fakedb.createUser(app);
  const userGroup = fakedb.createTimetableGroup(app, { users: [{ user, priority: 0 }] });
  const randomGroup = fakedb.createTimetableGroup(app);

  it('should fail as user is not authenticated', () =>
    pactum.spec().post('/timetable/current').expectAppError(ERROR_CODE.NOT_LOGGED_IN));

  it('should fail as body is not valid', () =>
    pactum
      .spec()
      .post('/timetable/current')
      .withBearerToken(user.token)
      .expectAppError(ERROR_CODE.PARAM_MISSING, 'duration, firstRepetitionDate, groups, location'));

  it('should fail as the groups field is empty', () =>
    pactum
      .spec()
      .post('/timetable/current')
      .withBearerToken(user.token)
      .withJson({
        location: 'In the test ig ?',
        duration: 3,
        firstRepetitionDate: new Date(0).toISOString(),
        repetitionFrequency: 10,
        repetitions: 4,
        groups: [],
      })
      .expectAppError(ERROR_CODE.PARAM_IS_EMPTY, 'groups'));

  it('should fail as the group id is not a uuid', () =>
    pactum
      .spec()
      .post('/timetable/current')
      .withBearerToken(user.token)
      .withJson({
        location: 'In the test ig ?',
        duration: 3,
        firstRepetitionDate: new Date(0).toISOString(),
        repetitionFrequency: 10,
        repetitions: 4,
        groups: ['abcdef'],
      })
      .expectAppError(ERROR_CODE.PARAM_NOT_UUID, 'groups'));

  it('should fail as the group does not exist', () =>
    pactum
      .spec()
      .post('/timetable/current')
      .withBearerToken(user.token)
      .withJson({
        location: 'In the test ig ?',
        duration: 3,
        firstRepetitionDate: new Date(0).toISOString(),
        repetitionFrequency: 10,
        repetitions: 4,
        groups: [Dummies.UUID],
      })
      .expectAppError(ERROR_CODE.NO_SUCH_TIMETABLE_GROUP, Dummies.UUID));

  it('should fail as the group is not a group of the user', () =>
    pactum
      .spec()
      .post('/timetable/current')
      .withBearerToken(user.token)
      .withJson({
        location: 'In the test ig ?',
        duration: 3,
        firstRepetitionDate: new Date(0).toISOString(),
        repetitionFrequency: 10,
        repetitions: 4,
        groups: [randomGroup.id],
      })
      .expectAppError(ERROR_CODE.NO_SUCH_TIMETABLE_GROUP, randomGroup.id));

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
