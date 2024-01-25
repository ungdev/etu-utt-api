import { createCriterion, createUE, createUser } from '../../utils/fakedb';
import * as pactum from 'pactum';
import { ERROR_CODE } from 'src/exceptions';
import { UEService } from '../../../src/ue/ue.service';
import { e2eSuite } from '../../utils/test_utils';

const GetRateE2ESpec = e2eSuite('GET /ue/{ueCode}/rate', (app) => {
  const user = createUser(app);
  const user2 = createUser(app, { login: 'user2' });
  const ue = createUE(app, {
    code: `XX00`,
  });
  const c1 = createCriterion(app, 'difficulty');
  const c2 = createCriterion(app, 'interest');

  beforeAll(async () => {
    await app().get(UEService).doRateUE(user.id, ue.code, {
      criterion: c1.id,
      value: 1,
    });
    await app().get(UEService).doRateUE(user.id, ue.code, {
      criterion: c2.id,
      value: 5,
    });
    await app().get(UEService).doRateUE(user2.id, ue.code, {
      criterion: c1.id,
      value: 2,
    });
  });

  it('should return a 401 as user is not authenticated', () => {
    return pactum.spec().get('/ue/XX00/rate').expectAppError(ERROR_CODE.NOT_LOGGED_IN);
  });

  it('should return an error if the ue does not exist', () => {
    return pactum.spec().withBearerToken(user.token).get('/ue/AA01/rate').expectAppError(ERROR_CODE.NO_SUCH_UE, 'AA01');
  });

  it('should return the user rate for the UE', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get('/ue/XX00/rate')
      .expectUERates([
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
      .expectUERates([
        {
          criterionId: c1.id,
          value: 2,
        },
      ]);
  });
});

export default GetRateE2ESpec;
