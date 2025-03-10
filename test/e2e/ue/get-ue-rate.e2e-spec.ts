import {
  createBranch,
  createBranchOption,
  createCriterion,
  createSemester,
  createUe,
  createUeof,
  createUeRating,
  createUser,
} from '../../utils/fakedb';
import * as pactum from 'pactum';
import { ERROR_CODE } from 'src/exceptions';
import { e2eSuite } from '../../utils/test_utils';

const GetRateE2ESpec = e2eSuite('GET /ue/{ueCode}/rate', (app) => {
  const user = createUser(app);
  const user2 = createUser(app, { login: 'user2' });
  const semester = createSemester(app);
  const branch = createBranch(app);
  const branchOption = createBranchOption(app, { branch });
  const ue = createUe(app);
  const ueof = createUeof(app, { branchOptions: [branchOption], semesters: [semester], ue });
  const c1 = createCriterion(app);
  const c2 = createCriterion(app);
  createUeRating(app, { ueof, criterion: c1, user }, { value: 1 });
  createUeRating(app, { ueof, criterion: c2, user }, { value: 5 });
  createUeRating(app, { ueof, criterion: c1, user: user2 }, { value: 2 });

  it('should return a 401 as user is not authenticated', () => {
    return pactum.spec().get(`/ue/${ue.code}/rate`).expectAppError(ERROR_CODE.NOT_LOGGED_IN);
  });

  it('should return an error if the ue does not exist', () => {
    const otherUeCode = ue.code === 'AA01' ? 'AA02' : 'AA01';
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get(`/ue/${otherUeCode}/rate`)
      .expectAppError(ERROR_CODE.NO_SUCH_UE, otherUeCode);
  });

  it('should return the user rate for the UE', () => {
    return pactum
      .spec()
      .withBearerToken(user.token)
      .get(`/ue/${ue.code}/rate`)
      .expectUeRates({
        [ueof.code]: [
          {
            criterion: c1,
            value: 1,
          },
          {
            criterion: c2,
            value: 5,
          },
        ]
          .sort((a, b) => a.criterion.name.localeCompare(b.criterion.name))
          .map((rate) => ({
            criterionId: rate.criterion.id,
            value: rate.value,
          })),
      });
  });

  it('should return the user rate for the UE (partial rating)', () => {
    return pactum
      .spec()
      .withBearerToken(user2.token)
      .get(`/ue/${ue.code}/rate`)
      .expectUeRates({
        [ueof.code]: [
          {
            criterionId: c1.id,
            value: 2,
          },
        ],
      });
  });
});

export default GetRateE2ESpec;
