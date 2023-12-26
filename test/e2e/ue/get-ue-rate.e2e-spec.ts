import { createCriterion, createUE, createUser, suite } from '../../test_utils';
import * as pactum from 'pactum';
import { HttpStatus } from '@nestjs/common';
import { ERROR_CODE } from 'src/exceptions';
import { UEService } from '../../../src/ue/ue.service';

const GetRateE2ESpec = suite('GET /ue/{ueCode}/rate', (app) => {
  const user = createUser(app);
  const user2 = createUser(app, { login: 'user2' });
  const ue = createUE(app, {
    code: `XX00`,
  });
  const c1 = createCriterion(app, 'difficulty');
  const c2 = createCriterion(app, 'interest');

  beforeAll(async () => {
    await app().get(UEService).doRateUE(user, ue.code, {
      criterion: c1.id,
      value: 1,
    });
    await app().get(UEService).doRateUE(user, ue.code, {
      criterion: c2.id,
      value: 5,
    });
    await app().get(UEService).doRateUE(user2, ue.code, {
      criterion: c1.id,
      value: 2,
    });
  });

  it('should return a 401 as user is not authenticated', () => {
    return pactum
      .spec()
      .get('/ue/XX00/rate')
      .expectStatus(HttpStatus.UNAUTHORIZED);
  });

  it('should return an error if the ue does not exist', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue/AA01/rate')
      .expectStatus(HttpStatus.NOT_FOUND)
      .expectJson({
        errorCode: ERROR_CODE.NO_SUCH_UE,
        error: 'The UE AA01 does not exist',
      });
  });

  it('should return the user rate for the UE', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue/XX00/rate')
      .expectStatus(HttpStatus.OK)
      .expectJson([
        {
          criterionId: c1.id,
          value: 1,
        },
        {
          criterionId: c2.id,
          value: 5,
        },
      ]);
  });

  it('should return the user rate for the UE (partial rating)', () => {
    return pactum
      .spec()
      .withBearerToken(user2.token)
      .get('/ue/XX00/rate')
      .expectStatus(HttpStatus.OK)
      .expectJson([
        {
          criterionId: c1.id,
          value: 2,
        },
      ]);
  });
});

export default GetRateE2ESpec;
