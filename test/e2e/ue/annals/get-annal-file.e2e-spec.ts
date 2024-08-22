import * as pactum from 'pactum';
import {
  createUser,
  createBranch,
  createBranchOption,
  createSemester,
  createUe,
  createUeSubscription,
  createAnnalType,
  createAnnal,
} from '../../../utils/fakedb';
import { Dummies, e2eSuite } from '../../../utils/test_utils';
import { ERROR_CODE } from '../../../../src/exceptions';
import { CommentStatus } from '../../../../src/ue/comments/interfaces/comment.interface';

const GetAnnalFile = e2eSuite('GET /ue/annals/{annalId}', (app) => {
  const senderUser = createUser(app);
  const nonUeUser = createUser(app, { login: 'user2', studentId: 2 });
  // const moderator = createUser(app, { login: 'user3', studentId: 3, permissions: ['annalModerator'] });
  const nonStudentUser = createUser(app, { login: 'nonStudent', studentId: 4, userType: 'TEACHER' });
  const annalType = createAnnalType(app);
  const semester = createSemester(app);
  const branch = createBranch(app);
  const branchOption = createBranchOption(app, { branch });
  const ue = createUe(app, { openSemesters: [semester], branchOption: [branchOption] });
  createUeSubscription(app, { user: senderUser, ue, semester });
  const annal_not_validated = createAnnal(
    app,
    { semester, sender: senderUser, type: annalType, ue },
    { status: CommentStatus.UNVERIFIED },
  );
  const annal_validated = createAnnal(app, { semester, sender: senderUser, type: annalType, ue });
  const annal_not_uploaded = createAnnal(
    app,
    { semester, sender: senderUser, type: annalType, ue },
    { status: CommentStatus.UNVERIFIED | CommentStatus.PROCESSING },
  );
  const annal_deleted = createAnnal(
    app,
    { semester, sender: senderUser, type: annalType, ue },
    { status: CommentStatus.VALIDATED | CommentStatus.DELETED },
  );

  it('should return a 401 as user is not authenticated', () => {
    return pactum.spec().get(`/ue/annals/${annal_validated.id}`).expectAppError(ERROR_CODE.NOT_LOGGED_IN);
  });

  it('should return a 404 because annal does not exist', () => {
    return pactum
      .spec()
      .withBearerToken(senderUser.token)
      .get(`/ue/annals/${Dummies.UUID}`)
      .expectAppError(ERROR_CODE.NO_SUCH_ANNAL, Dummies.UUID);
  });

  it('should return a 403 because user is not a student', () => {
    return pactum
      .spec()
      .withBearerToken(nonStudentUser.token)
      .get(`/ue/annals/${annal_validated.id}`)
      .expectAppError(ERROR_CODE.FORBIDDEN_INVALID_ROLE, 'STUDENT');
  });

  it('should return a 404 because annal is not validated', () => {
    return pactum
      .spec()
      .withBearerToken(nonUeUser.token)
      .get(`/ue/annals/${annal_not_validated.id}`)
      .expectAppError(ERROR_CODE.NO_SUCH_ANNAL, annal_not_validated.id);
  });

  it('should return a 404 because annal is processing', () => {
    return pactum
      .spec()
      .withBearerToken(nonUeUser.token)
      .get(`/ue/annals/${annal_not_uploaded.id}`)
      .expectAppError(ERROR_CODE.NO_SUCH_ANNAL, annal_not_uploaded.id);
  });

  it('should return a 404 because annal is deleted', () => {
    return pactum
      .spec()
      .withBearerToken(senderUser.token)
      .get(`/ue/annals/${annal_deleted.id}`)
      .expectAppError(ERROR_CODE.NO_SUCH_ANNAL, annal_deleted.id);
  });
});

export default GetAnnalFile;
