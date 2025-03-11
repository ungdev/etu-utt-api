import { e2eSuite } from '../../utils/test_utils';
import * as pactum from 'pactum';
import {
  createBranch,
  createBranchOption,
  createSemester,
  createUe,
  createUeof,
  createUeSubscription,
  createUser,
} from '../../utils/fakedb';
import { ERROR_CODE } from '../../../src/exceptions';

const GetMyUesE2ESpec = e2eSuite('GET ue/of/me', (app) => {
  const user = createUser(app);
  const branch = createBranch(app);
  const branchOption = createBranchOption(app, { branch });
  const semester = createSemester(app, {
    start: new Date(Date.now() - 30 * 24 * 3_600_000),
    end: new Date(Date.now() + 30 * 24 * 3_600_000),
  });
  const semester2 = createSemester(app, {
    start: new Date(Date.now() - 90 * 24 * 3_600_000),
    end: new Date(Date.now() - 30 * 24 * 3_600_000),
  });
  const ue = createUe(app);
  const ueof = createUeof(app, { branchOptions: [branchOption], semesters: [semester], ue });
  createUeSubscription(app, { user, ueof, semester });
  const ue2 = createUe(app);
  const ueof2 = createUeof(app, { branchOptions: [branchOption], semesters: [semester2], ue: ue2 });
  createUeSubscription(app, { user, ueof: ueof2, semester: semester2 });
  const user2 = createUser(app);
  const ue3 = createUe(app);
  const ueof3 = createUeof(app, { branchOptions: [branchOption], semesters: [semester], ue: ue3 });
  createUeSubscription(app, { user: user2, ueof: ueof3, semester });
  const formerStudent = createUser(app, { userType: 'FORMER_STUDENT' });

  it('should fail as the user is not authenticated', () =>
    pactum.spec().get('/ue/of/me').expectAppError(ERROR_CODE.NOT_LOGGED_IN));

  it('should fail as user is not a student', () =>
    pactum
      .spec()
      .get('/ue/of/me')
      .withBearerToken(formerStudent.token)
      .expectAppError(ERROR_CODE.FORBIDDEN_INVALID_ROLE, 'STUDENT'));

  it('should return ue1 as this is the only UE user is currently following', () =>
    pactum
      .spec()
      .get('/ue/of/me')
      .withBearerToken(user.token)
      .expectUes([{ ...ue, ueofs: [ueof] }]));
});

export default GetMyUesE2ESpec;
