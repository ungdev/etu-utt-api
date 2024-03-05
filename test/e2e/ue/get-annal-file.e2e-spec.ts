import * as pactum from 'pactum';
import {
  createUser,
  createBranch,
  createBranchOption,
  createSemester,
  createUE,
  createUESubscription,
  createAnnalType,
  createAnnal,
} from '../../utils/fakedb';
import { Dummies, e2eSuite } from '../../utils/test_utils';
import { ERROR_CODE } from '../../../src/exceptions';

const GetAnnalFile = e2eSuite('GET /ue/{ueCode}/annals/{annalId}', (app) => {
  const senderUser = createUser(app);
  const nonUeUser = createUser(app, { login: 'user2', studentId: 2 });
  // const moderator = createUser(app, { login: 'user3', studentId: 3, permissions: ['annalModerator'] });
  const nonStudentUser = createUser(app, { login: 'nonStudent', studentId: 4, role: 'TEACHER' });
  const annalType = createAnnalType(app);
  const semester = createSemester(app);
  const branch = createBranch(app);
  const branchOption = createBranchOption(app, { branch });
  const ue = createUE(app, { semesters: [semester], branchOption });
  createUESubscription(app, { user: senderUser, ue, semester });
  const annal_not_validated = createAnnal(
    app,
    { semester, sender: senderUser, type: annalType, ue },
    { validated: false },
  );
  const annal_validated = createAnnal(app, { semester, sender: senderUser, type: annalType, ue });
  const annal_not_uploaded = createAnnal(
    app,
    { semester, sender: senderUser, type: annalType, ue },
    { uploadComplete: false },
  );
  const annal_deleted = createAnnal(app, { semester, sender: senderUser, type: annalType, ue }, { deleted: true });

  it('should return a 401 as user is not authenticated', () => {
    return pactum.spec().get(`/ue/${ue.code}/annals/${annal_validated.id}`).expectAppError(ERROR_CODE.NOT_LOGGED_IN);
  });

  it('should return a 404 because UE does not exist', () => {
    return pactum
      .spec()
      .withBearerToken(senderUser.token)
      .get(`/ue/${ue.code.slice(0, ue.code.length - 1)}/annals/${annal_validated.id}`)
      .expectAppError(ERROR_CODE.NO_SUCH_UE, ue.code.slice(0, ue.code.length - 1));
  });

  it('should return a 404 because annal does not exist', () => {
    return pactum
      .spec()
      .withBearerToken(senderUser.token)
      .get(`/ue/${ue.code}/annals/${Dummies.UUID}`)
      .expectAppError(ERROR_CODE.NO_SUCH_ANNAL, Dummies.UUID, ue.code);
  });

  it('should return a 403 because user is not a student', () => {
    return pactum
      .spec()
      .withBearerToken(nonStudentUser.token)
      .get(`/ue/${ue.code}/annals/${annal_validated.id}`)
      .expectAppError(ERROR_CODE.FORBIDDEN_INVALID_ROLE, 'STUDENT');
  });

  it('should return a 404 because annal is not validated', () => {
    return pactum
      .spec()
      .withBearerToken(nonUeUser.token)
      .get(`/ue/${ue.code}/annals/${annal_not_validated.id}`)
      .expectAppError(ERROR_CODE.NO_SUCH_ANNAL, annal_not_validated.id, ue.code);
  });

  it('should return a 404 because annal is processing', () => {
    return pactum
      .spec()
      .withBearerToken(nonUeUser.token)
      .get(`/ue/${ue.code}/annals/${annal_not_uploaded.id}`)
      .expectAppError(ERROR_CODE.NO_SUCH_ANNAL, annal_not_uploaded.id, ue.code);
  });

  it('should return a 404 because annal is deleted', () => {
    return pactum
      .spec()
      .withBearerToken(senderUser.token)
      .get(`/ue/${ue.code}/annals/${annal_deleted.id}`)
      .expectAppError(ERROR_CODE.NO_SUCH_ANNAL, annal_deleted.id, ue.code);
  });
});

export default GetAnnalFile;
