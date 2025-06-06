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
  createUeof,
} from '../../../utils/fakedb';
import { Dummies, JsonLike, e2eSuite } from '../../../utils/test_utils';
import { ERROR_CODE } from '../../../../src/exceptions';
import { CommentStatus } from 'src/ue/comments/interfaces/comment.interface';
import { pick } from '../../../../src/utils';

const EditAnnal = e2eSuite('PATCH /ue/annals/{annalId}', (app) => {
  const senderUser = createUser(app, { permissions: ['API_UPLOAD_ANNALS'] });
  const nonUeUser = createUser(app, { login: 'user2', studentId: 2, permissions: ['API_UPLOAD_ANNALS'] });
  const userNoPermission = createUser(app);
  const annalType = createAnnalType(app);
  const semester = createSemester(app);
  const branch = createBranch(app);
  const branchOption = createBranchOption(app, { branch });
  const ue = createUe(app);
  const ueof = createUeof(app, { branchOptions: [branchOption], semesters: [semester], ue });
  createUeSubscription(app, { user: senderUser, ueof, semester });
  const annal_validated = createAnnal(app, { semester, sender: senderUser, type: annalType, ueof });
  const annal_not_uploaded = createAnnal(
    app,
    { semester, sender: senderUser, type: annalType, ueof },
    { status: CommentStatus.PROCESSING | CommentStatus.UNVERIFIED },
  );
  const annal_deleted = createAnnal(
    app,
    { semester, sender: senderUser, type: annalType, ueof },
    { status: CommentStatus.VALIDATED | CommentStatus.DELETED },
  );

  const xx_analType_xx = createAnnalType(app, {});
  const xx_semester_xx = createSemester(app, {});
  const generateBody = () => ({
    semester: xx_semester_xx.code,
    typeId: xx_analType_xx.id,
  });

  it('should return a 401 as user is not authenticated', () => {
    return pactum.spec().patch(`/ue/annals/${annal_validated.id}`).expectAppError(ERROR_CODE.NOT_LOGGED_IN);
  });

  it('should fail as the user does not have the required permissions', () =>
    pactum
      .spec()
      .withBearerToken(userNoPermission.token)
      .patch(`/ue/annals/${Dummies.UUID}`)
      .withBody(generateBody())
      .expectAppError(ERROR_CODE.FORBIDDEN_NOT_ENOUGH_API_PERMISSIONS, 'API_UPLOAD_ANNALS'));

  it('should return a 404 because annal does not exist', () => {
    return pactum
      .spec()
      .withBearerToken(senderUser.token)
      .patch(`/ue/annals/${Dummies.UUID}`)
      .withBody(generateBody())
      .expectAppError(ERROR_CODE.NO_SUCH_ANNAL, Dummies.UUID);
  });

  it('should return a 403 because user is not the author', () => {
    return pactum
      .spec()
      .withBearerToken(nonUeUser.token)
      .patch(`/ue/annals/${annal_validated.id}`)
      .withBody(generateBody())
      .expectAppError(ERROR_CODE.NOT_ANNAL_SENDER);
  });

  it('should return a 404 because annal is processing', () => {
    return pactum
      .spec()
      .withBearerToken(nonUeUser.token)
      .patch(`/ue/annals/${annal_not_uploaded.id}`)
      .withBody(generateBody())
      .expectAppError(ERROR_CODE.NO_SUCH_ANNAL, annal_not_uploaded.id);
  });

  it('should return a 404 because annal is deleted', () => {
    return pactum
      .spec()
      .withBearerToken(senderUser.token)
      .patch(`/ue/annals/${annal_deleted.id}`)
      .withBody(generateBody())
      .expectAppError(ERROR_CODE.NO_SUCH_ANNAL, annal_deleted.id);
  });

  it('should return the updated annal metadata', async () => {
    return pactum
      .spec()
      .withBearerToken(senderUser.token)
      .patch(`/ue/annals/${annal_validated.id}`)
      .withBody(generateBody())
      .expectUeAnnal({
        semesterId: xx_semester_xx.code,
        type: xx_analType_xx,
        status: CommentStatus.VALIDATED,
        sender: pick(senderUser, 'id', 'firstName', 'lastName'),
        id: annal_validated.id,
        createdAt: annal_validated.createdAt.toISOString(),
        updatedAt: JsonLike.ANY_DATE,
      });
  });
});

export default EditAnnal;
