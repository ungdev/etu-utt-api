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
import { PrismaService } from '../../../../src/prisma/prisma.service';

const DeleteAnnal = e2eSuite('DELETE /ue/annals/{annalId}', (app) => {
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

  it('should return a 401 as user is not authenticated', () => {
    return pactum.spec().delete(`/ue/annals/${annal_validated.id}`).expectAppError(ERROR_CODE.NOT_LOGGED_IN);
  });

  it('should return a 404 because annal does not exist', () => {
    return pactum
      .spec()
      .withBearerToken(senderUser.token)
      .delete(`/ue/annals/${Dummies.UUID}`)
      .expectAppError(ERROR_CODE.NO_SUCH_ANNAL, Dummies.UUID);
  });

  it('should fail as the user does not have the required permissions', () =>
    pactum
      .spec()
      .withBearerToken(userNoPermission.token)
      .delete(`/ue/annals/${Dummies.UUID}`)
      .expectAppError(ERROR_CODE.FORBIDDEN_NOT_ENOUGH_API_PERMISSIONS, 'API_UPLOAD_ANNALS'));

  it('should return a 403 because user is not the author', () => {
    return pactum
      .spec()
      .withBearerToken(nonUeUser.token)
      .delete(`/ue/annals/${annal_validated.id}`)
      .expectAppError(ERROR_CODE.NOT_ANNAL_SENDER);
  });

  it('should return the updated annal metadata', async () => {
    await pactum
      .spec()
      .withBearerToken(senderUser.token)
      .delete(`/ue/annals/${annal_validated.id}`)
      .expectUeAnnal({
        ...pick(annal_validated, 'id', 'semesterId'),
        type: annalType,
        status: CommentStatus.DELETED | CommentStatus.VALIDATED,
        sender: pick(senderUser, 'id', 'firstName', 'lastName'),
        createdAt: annal_validated.createdAt.toISOString(),
        updatedAt: JsonLike.ANY_DATE,
      });
    return app()
      .get(PrismaService)
      .ueAnnal.update({
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
