import { HttpStatus } from '@nestjs/common';
import {
  createUser,
  suite,
  createUE,
  makeUserJoinUE,
  createCriterion,
} from '../../test_utils';
import * as pactum from 'pactum';
import { UEUnComputedDetail } from '../../../src/ue/interfaces/ue-detail.interface';
import { ERROR_CODE } from 'src/exceptions';
import { Criterion } from 'src/ue/interfaces/criterion.interface';

const PutRate = suite('PUT /ue/{ueCode}/rate', (app) => {
  const user = createUser(app);
  const user2 = createUser(app, { login: 'user2' });
  let ue: UEUnComputedDetail;
  let criterion: Criterion;

  beforeAll(async () => {
    ue = (await createUE(app)) as UEUnComputedDetail;
    await makeUserJoinUE(app, user.id, ue.code);
    criterion = await createCriterion(app, 'etAlors');
  });

  it('should return a 401 as user is not authenticated', () => {
    return pactum
      .spec()
      .put(`/ue/${ue.code}/rate`)
      .expectStatus(HttpStatus.UNAUTHORIZED);
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
      .expectStatus(HttpStatus.FORBIDDEN)
      .expectJson({
        errorCode: ERROR_CODE.NOT_ALREADY_DONE_UE,
        error: 'You must have done this UE before to perform this action',
      });
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
      .expectStatus(HttpStatus.BAD_REQUEST);
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
      .expectStatus(HttpStatus.BAD_REQUEST);
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
      .expectStatus(HttpStatus.NOT_FOUND)
      .expectJson({
        errorCode: ERROR_CODE.NO_SUCH_CRITERION,
        error: 'This criterion does not exist',
      });
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
      .expectStatus(HttpStatus.NOT_FOUND)
      .expectJson({
        errorCode: ERROR_CODE.NO_SUCH_UE,
        error: `The UE ${ue.code.slice(0, 3)}9 does not exist`,
      });
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
      .expectStatus(HttpStatus.OK)
      .expectJson({
        criterionId: criterion.id,
        value: 1,
      });
  });
});

export default PutRate;
