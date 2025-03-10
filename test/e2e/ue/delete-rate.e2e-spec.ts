import {
  createUser,
  createUe,
  createUeof,
  createCriterion,
  createBranchOption,
  createBranch,
  createSemester,
  createUeSubscription,
  createUeRating,
} from '../../utils/fakedb';
import * as pactum from 'pactum';
import { ERROR_CODE } from 'src/exceptions';
import { Dummies, e2eSuite } from '../../utils/test_utils';
import { faker } from '@faker-js/faker';

const DeleteRate = e2eSuite('DELETE /ue/ueof/{ueofCode}/rate/{critetionId}', (app) => {
  const user = createUser(app);
  const user2 = createUser(app, { login: 'user2' });
  const semester = createSemester(app);
  const branch = createBranch(app);
  const branchOption = createBranchOption(app, { branch });
  const ue = createUe(app);
  const ueof = createUeof(app, { branchOptions: [branchOption], semesters: [semester], ue });
  const criterion = createCriterion(app);
  createUeSubscription(app, { user, ueof, semester });
  const rating = createUeRating(app, { user, ueof, criterion });

  it('should return a 401 as user is not authenticated', () => {
    return pactum.spec().delete(`/ue/ueof/${ueof.code}/rate/${criterion.id}`).expectAppError(ERROR_CODE.NOT_LOGGED_IN);
  });

  it('should return a 403 as user has not rated the UE', () => {
    return pactum
      .spec()
      .withBearerToken(user2.token)
      .delete(`/ue/ueof/${ueof.code}/rate/${criterion.id}`)
      .expectAppError(ERROR_CODE.NOT_ALREADY_RATED_UEOF, ueof.code, criterion.id);
  });

  it('should return a 404 as the UE does not exist', () => {
    const nonExistentCode = faker.db.ue.code();
    return pactum
      .spec()
      .withBearerToken(user2.token)
      .delete(`/ue/ueof/${nonExistentCode}/rate/${criterion.id}`)
      .expectAppError(ERROR_CODE.NO_SUCH_UEOF, nonExistentCode);
  });

  it('should return a 404 as the criterion does not exist', () => {
    return pactum
      .spec()
      .withBearerToken(user2.token)
      .delete(`/ue/ueof/${ueof.code}/rate/${Dummies.UUID}`)
      .expectAppError(ERROR_CODE.NO_SUCH_CRITERION);
  });

  it('should return the deleted rate for specific criterion', async () => {
    await pactum.spec().withBearerToken(user.token).delete(`/ue/ueof/${ueof.code}/rate/${criterion.id}`).expectUeRate({
      criterionId: criterion.id,
      value: rating.value,
    });
    return createUeRating(app, { user, ueof, criterion }, rating, true);
  });
});

export default DeleteRate;
