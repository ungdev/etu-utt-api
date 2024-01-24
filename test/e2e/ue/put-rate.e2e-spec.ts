import { createUser, createUE, makeUserJoinUE, createCriterion } from '../../utils/fakedb';
import * as pactum from 'pactum';
import { ERROR_CODE } from 'src/exceptions';
import { e2eSuite } from '../../utils/test_utils';

const PutRate = e2eSuite('PUT /ue/{ueCode}/rate', (app) => {
  const user = createUser(app);
  const user2 = createUser(app, { login: 'user2' });
  const ue = createUE(app);
  makeUserJoinUE(app, user, ue);
  const criterion = createCriterion(app, 'etAlors');

  it('should return a 401 as user is not authenticated', () => {
    return pactum.spec().put(`/ue/${ue.code}/rate`).expectAppError(ERROR_CODE.NOT_LOGGED_IN);
  });

  it('should return a 403 as user has not done the UE', () => {
    return pactum
      .spec()
      .withBearerToken(user2.token)
      .put(`/ue/${ue.code}/rate`)
      .withBody({
        criterion: criterion.id,
        value: 1,
      })
      .expectAppError(ERROR_CODE.NOT_ALREADY_DONE_UE);
  });

  it('should return a 400 as value is not a number', () => {
    return pactum
      .spec()
      .withBearerToken(user2.token)
      .put(`/ue/${ue.code}/rate`)
      .withBody({
        criterion: criterion.id,
        value: 'helloWorld',
      })
      .expectAppError(ERROR_CODE.PARAM_NOT_NUMBER, 'value');
  });

  it('should return a 400 as value is too high', () => {
    return pactum
      .spec()
      .withBearerToken(user2.token)
      .put(`/ue/${ue.code}/rate`)
      .withBody({
        criterion: criterion.id,
        value: 6,
      })
      .expectAppError(ERROR_CODE.PARAM_TOO_HIGH, 'value');
  });

  it('should return a 400 as value is too low', () => {
    return pactum
      .spec()
      .withBearerToken(user2.token)
      .put(`/ue/${ue.code}/rate`)
      .withBody({
        criterion: criterion.id,
        value: 0,
      })
      .expectAppError(ERROR_CODE.PARAM_TOO_LOW, 'value');
  });

  it('should return a 400 as the criterion is not a string', () => {
    return pactum
      .spec()
      .withBearerToken(user2.token)
      .put(`/ue/${ue.code}/rate`)
      .withBody({
        criterion: true,
        value: 1,
      })
      .expectAppError(ERROR_CODE.PARAM_NOT_STRING, 'criterion');
  });

  it('should return a 404 as the criterion does not exist', () => {
    return pactum
      .spec()
      .withBearerToken(user2.token)
      .put(`/ue/${ue.code}/rate`)
      .withBody({
        criterion: criterion.id.slice(0, 10),
        value: 1,
      })
      .expectAppError(ERROR_CODE.NO_SUCH_CRITERION);
  });

  it('should return a 404 as the UE does not exist', () => {
    return pactum
      .spec()
      .withBearerToken(user2.token)
      .put(`/ue/${ue.code.slice(0, 3)}9/rate`)
      .withBody({
        criterion: criterion.id,
        value: 1,
      })
      .expectAppError(ERROR_CODE.NO_SUCH_UE, `${ue.code.slice(0, 3)}9`);
  });

  it('should return the updated rate for specific criterion', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .put(`/ue/${ue.code}/rate`)
      .withBody({
        criterion: criterion.id,
        value: 1,
      })
      .expectUERate({
        criterionId: criterion.id,
        value: 1,
      });
  });
});

export default PutRate;
