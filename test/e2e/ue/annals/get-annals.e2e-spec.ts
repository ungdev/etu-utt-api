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
import { e2eSuite } from '../../../utils/test_utils';
import { ERROR_CODE } from '../../../../src/exceptions';
import { UeAnnalFile } from '../../../../src/ue/annals/interfaces/annal.interface';
import { JsonLikeVariant } from 'test/declarations';
import { pick } from '../../../../src/utils';
import { CommentStatus } from '../../../../src/ue/comments/interfaces/comment.interface';

const GetAnnal = e2eSuite('GET /ue/annals', (app) => {
  const senderUser = createUser(app);
  const nonUeUser = createUser(app, { login: 'user2', studentId: 2 });
  const moderator = createUser(app, { login: 'user3', studentId: 3, permissions: ['annalModerator'] });
  const nonStudentUser = createUser(app, { login: 'nonStudent', studentId: 4, userType: 'TEACHER' });
  const annalType = createAnnalType(app);
  const semester = createSemester(app);
  const branch = createBranch(app);
  const branchOption = createBranchOption(app, { branch });
  const ue = createUe(app);
  const ueof = createUeof(app, { branchOptions: [branchOption], semesters: [semester], ue });
  createUeSubscription(app, { user: senderUser, ueof, semester });
  const annal_not_validated = createAnnal(
    app,
    { semester, sender: senderUser, type: annalType, ueof },
    { status: CommentStatus.UNVERIFIED },
  );
  const annal_validated = createAnnal(app, { semester, sender: senderUser, type: annalType, ueof });
  const annal_not_uploaded = createAnnal(
    app,
    { semester, sender: senderUser, type: annalType, ueof },
    { status: CommentStatus.UNVERIFIED | CommentStatus.PROCESSING },
  );
  const annal_deleted = createAnnal(
    app,
    { semester, sender: senderUser, type: annalType, ueof },
    { status: CommentStatus.DELETED | CommentStatus.VALIDATED },
  );

  it('should return a 401 as user is not authenticated', () => {
    return pactum
      .spec()
      .get(`/ue/annals`)
      .withQueryParams({
        ueCode: ue.code,
      })
      .expectAppError(ERROR_CODE.NOT_LOGGED_IN);
  });

  it('should return a 404 because UE does not exist', () => {
    return pactum
      .spec()
      .withBearerToken(senderUser.token)
      .get(`/ue/annals`)
      .withQueryParams({
        ueCode: ue.code.slice(0, ue.code.length - 1),
      })
      .expectAppError(ERROR_CODE.NO_SUCH_UE, ue.code.slice(0, ue.code.length - 1));
  });

  it('should return a 403 because user is not a student', () => {
    return pactum
      .spec()
      .withBearerToken(nonStudentUser.token)
      .get(`/ue/annals`)
      .withQueryParams({
        ueCode: ue.code,
      })
      .expectAppError(ERROR_CODE.FORBIDDEN_INVALID_ROLE, 'STUDENT');
  });

  it('should return the ue annal list', async () => {
    await pactum
      .spec()
      .withBearerToken(senderUser.token)
      .get(`/ue/annals`)
      .withQueryParams({
        ueCode: ue.code,
      })
      .expectUeAnnals([annal_not_validated, annal_validated, annal_not_uploaded].map(formatAnnalFile));
    await pactum
      .spec()
      .withBearerToken(nonUeUser.token)
      .get(`/ue/annals`)
      .withQueryParams({
        ueCode: ue.code,
      })
      .expectUeAnnals([annal_validated].map(formatAnnalFile));
    return pactum
      .spec()
      .withBearerToken(moderator.token)
      .get(`/ue/annals`)
      .withQueryParams({
        ueCode: ue.code,
      })
      .expectUeAnnals([annal_not_validated, annal_validated, annal_not_uploaded, annal_deleted].map(formatAnnalFile));
  });

  const formatAnnalFile = (from: Partial<UeAnnalFile>): JsonLikeVariant<UeAnnalFile> => {
    return {
      ...pick(from, 'id', 'semesterId', 'status', 'sender', 'type', 'ueof'),
      createdAt: from.createdAt?.toISOString(),
      updatedAt: from.updatedAt?.toISOString(),
    };
  };
});

export default GetAnnal;
