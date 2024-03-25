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
} from '../../../utils/fakedb';
import { e2eSuite } from '../../../utils/test_utils';
import { ERROR_CODE } from '../../../../src/exceptions';
import { UEAnnalFile } from '../../../../src/ue/annals/interfaces/annal.interface';
import { RawUEAnnal } from '../../../../src/prisma/types';
import { JsonLikeVariant } from 'test/declarations';
import { pick } from '../../../../src/utils';
import { CommentStatus } from '../../../../src/ue/interfaces/comment.interface';

const GetAnnal = e2eSuite('GET /ue/annals', (app) => {
  const senderUser = createUser(app);
  const nonUeUser = createUser(app, { login: 'user2', studentId: 2 });
  const moderator = createUser(app, { login: 'user3', studentId: 3, permissions: ['annalModerator'] });
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
      .expectUEAnnals([annal_not_validated, annal_validated, annal_not_uploaded].map(formatAnnalFile));
    await pactum
      .spec()
      .withBearerToken(nonUeUser.token)
      .get(`/ue/annals`)
      .withQueryParams({
        ueCode: ue.code,
      })
      .expectUEAnnals([annal_validated].map(formatAnnalFile));
    return pactum
      .spec()
      .withBearerToken(moderator.token)
      .get(`/ue/annals`)
      .withQueryParams({
        ueCode: ue.code,
      })
      .expectUEAnnals([annal_not_validated, annal_validated, annal_not_uploaded, annal_deleted].map(formatAnnalFile));
  });

  const formatAnnalFile = (from: Partial<RawUEAnnal>): JsonLikeVariant<UEAnnalFile> => {
    return {
      ...pick(from, 'id', 'semesterId'),
      status: from.deletedAt
        ? CommentStatus.DELETED
        : from.validatedAt
        ? CommentStatus.VALIDATED
        : from.uploadComplete
        ? CommentStatus.UNVERIFIED
        : CommentStatus.PROCESSING,
      sender: pick(
        [senderUser, nonUeUser, moderator, nonStudentUser].find((user) => user.id === from.senderId),
        'id',
        'firstName',
        'lastName',
      ),
      type: annalType,
      createdAt: from.createdAt?.toISOString(),
      updatedAt: from.updatedAt?.toISOString(),
      ue: {
        code: ue.code,
      },
    };
  };
});

export default GetAnnal;
