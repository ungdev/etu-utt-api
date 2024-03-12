import {
  createUser,
  createUE,
  createCriterion,
  createBranchOption,
  createBranch,
  createSemester,
  createUESubscription,
  createUERating,
} from '../../utils/fakedb';
import * as pactum from 'pactum';
import { ERROR_CODE } from 'src/exceptions';
import { Dummies, e2eSuite } from '../../utils/test_utils';

const DeleteRate = e2eSuite('DELETE /ue/{ueCode}/rate/{critetionId}', (app) => {
  const user = createUser(app);
  const user2 = createUser(app, { login: 'user2' });
  const semester = createSemester(app);
  const branch = createBranch(app);
  const branchOption = createBranchOption(app, { branch });
  const ue = createUE(app, { semesters: [semester], branchOption });
  const criterion = createCriterion(app);
  createUESubscription(app, { user, ue, semester });
  const rating = createUERating(app, { user, ue, criterion });

  it('should return a 401 as user is not authenticated', () => {
    return pactum.spec().delete(`/ue/${ue.code}/rate/${criterion.id}`).expectAppError(ERROR_CODE.NOT_LOGGED_IN);
  });

  it('should return a 403 as user has not rated the UE', () => {
    return pactum
      .spec()
      .withBearerToken(user2.token)
      .delete(`/ue/${ue.code}/rate/${criterion.id}`)
      .expectAppError(ERROR_CODE.NOT_ALREADY_RATED_UE, ue.code, criterion.id);
  });

  it('should return a 404 as the UE does not exist', () => {
    return pactum
      .spec()
      .withBearerToken(user2.token)
      .delete(`/ue/${ue.code.slice(0, 3)}9/rate/${criterion.id}`)
      .expectAppError(ERROR_CODE.NO_SUCH_UE, `${ue.code.slice(0, 3)}9`);
  });

  it('should return a 404 as the criterion does not exist', () => {
    return pactum
      .spec()
      .withBearerToken(user2.token)
      .delete(`/ue/${ue.code}/rate/${Dummies.UUID}`)
      .expectAppError(ERROR_CODE.NO_SUCH_CRITERION);
  });

  it('should return the deleted rate for specific criterion', async () => {
    await pactum.spec().withBearerToken(user.token).delete(`/ue/${ue.code}/rate/${criterion.id}`).expectUERate({
      criterionId: criterion.id,
      value: rating.value,
    });
    return createUERating(app, { user, ue, criterion }, rating, true);
  });
});

export default DeleteRate;
