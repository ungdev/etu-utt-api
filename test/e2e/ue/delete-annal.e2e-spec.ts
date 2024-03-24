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
import { Dummies, JsonLike, e2eSuite } from '../../utils/test_utils';
import { ERROR_CODE } from '../../../src/exceptions';
import { CommentStatus } from 'src/ue/interfaces/comment.interface';
import { pick } from '../../../src/utils';
import { PrismaService } from '../../../src/prisma/prisma.service';

const DeleteAnnal = e2eSuite('DELETE /ue/{ueCode}/annals/{annalId}', (app) => {
  const senderUser = createUser(app);
  const nonUeUser = createUser(app, { login: 'user2', studentId: 2 });
  const nonStudentUser = createUser(app, { login: 'nonStudent', studentId: 4, role: 'TEACHER' });
  const annalType = createAnnalType(app);
  const semester = createSemester(app);
  const branch = createBranch(app);
  const branchOption = createBranchOption(app, { branch });
  const ue = createUE(app, { semesters: [semester], branchOption });
  createUESubscription(app, { user: senderUser, ue, semester });
  const annal_validated = createAnnal(app, { semester, sender: senderUser, type: annalType, ue });

  it('should return a 401 as user is not authenticated', () => {
    return pactum.spec().delete(`/ue/${ue.code}/annals/${annal_validated.id}`).expectAppError(ERROR_CODE.NOT_LOGGED_IN);
  });

  it('should return a 404 because UE does not exist', () => {
    return pactum
      .spec()
      .withBearerToken(senderUser.token)
      .delete(`/ue/${ue.code.slice(0, ue.code.length - 1)}/annals/${annal_validated.id}`)
      .expectAppError(ERROR_CODE.NO_SUCH_UE, ue.code.slice(0, ue.code.length - 1));
  });

  it('should return a 404 because annal does not exist', () => {
    return pactum
      .spec()
      .withBearerToken(senderUser.token)
      .delete(`/ue/${ue.code}/annals/${Dummies.UUID}`)
      .expectAppError(ERROR_CODE.NO_SUCH_ANNAL, Dummies.UUID, ue.code);
  });

  it('should return a 403 because user is not a student', () => {
    return pactum
      .spec()
      .withBearerToken(nonStudentUser.token)
      .delete(`/ue/${ue.code}/annals/${annal_validated.id}`)
      .expectAppError(ERROR_CODE.FORBIDDEN_INVALID_ROLE, 'STUDENT');
  });

  it('should return a 403 because user is not the author', () => {
    return pactum
      .spec()
      .withBearerToken(nonUeUser.token)
      .delete(`/ue/${ue.code}/annals/${annal_validated.id}`)
      .expectAppError(ERROR_CODE.NOT_ANNAL_SENDER);
  });

  it('should return the updated annal metadata', async () => {
    await pactum
      .spec()
      .withBearerToken(senderUser.token)
      .delete(`/ue/${ue.code}/annals/${annal_validated.id}`)
      .expectUEAnnal({
        ...pick(annal_validated, 'id', 'semesterId'),
        type: annalType,
        status: CommentStatus.DELETED,
        sender: pick(senderUser, 'id', 'firstName', 'lastName'),
        createdAt: annal_validated.createdAt.toISOString(),
        updatedAt: JsonLike.ANY_DATE,
      });
    return app()
      .get(PrismaService)
      .uEAnnal.update({
        where: {
          id: annal_validated.id,
        },
        data: {
          deletedAt: null,
        },
      });
  });
});

export default DeleteAnnal;
