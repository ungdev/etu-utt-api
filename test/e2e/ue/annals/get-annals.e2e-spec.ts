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
import { AnnalStatus, UeAnnalFile } from '../../../../src/ue/annals/interfaces/annal.interface';
import { JsonLikeVariant } from 'test/declarations';
import { PermissionManager, pick } from '../../../../src/utils';

const GetAnnal = e2eSuite('GET /ue/annals', (app) => {
  const senderUser = createUser(app, { permissions: new PermissionManager().with('API_SEE_ANNALS') });
  const nonUeUser = createUser(app, {
    login: 'user2',
    studentId: 2,
    permissions: new PermissionManager().with('API_SEE_ANNALS'),
  });
  const moderator = createUser(app, {
    login: 'user3',
    studentId: 3,
    permissions: new PermissionManager().with('API_SEE_ANNALS').with('API_MODERATE_ANNALS'),
  });
  const userNoPermission = createUser(app);
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
    { status: AnnalStatus.UNVERIFIED },
  );
  const annal_validated = createAnnal(app, { semester, sender: senderUser, type: annalType, ueof });
  const annal_not_uploaded = createAnnal(
    app,
    { semester, sender: senderUser, type: annalType, ueof },
    { status: AnnalStatus.UNVERIFIED | AnnalStatus.PROCESSING },
  );
  const annal_deleted = createAnnal(
    app,
    { semester, sender: senderUser, type: annalType, ueof },
    { status: AnnalStatus.DELETED | AnnalStatus.VALIDATED },
  );

  it('should return a 401 as user is not authenticated', () => {
    return pactum.spec().get(`/ue/annals`).expectAppError(ERROR_CODE.NOT_LOGGED_IN);
  });

  it('should fail as the user does not have the required permissions', () =>
    pactum
      .spec()
      .withBearerToken(userNoPermission.token)
      .get(`/ue/annals`)
      .withQueryParams({
        ueCode: ue.code,
      })
      .expectAppError(ERROR_CODE.FORBIDDEN_NOT_ENOUGH_API_PERMISSIONS, 'API_SEE_ANNALS'));

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

  it('should return the ue annal list', async () => {
    await pactum
      .spec()
      .withBearerToken(senderUser.token)
      .get(`/ue/annals`)
      .withQueryParams({
        ueCode: ue.code,
      })
      .expectUeAnnals(
        [annal_not_validated, annal_validated, annal_not_uploaded]
          .mappedSort((annal) => [annal.createdAt.getTime(), annal.id])
          .map(formatAnnalFile),
      );
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
      .expectUeAnnals(
        [annal_not_validated, annal_deleted, annal_not_uploaded, annal_validated]
          .mappedSort((annal) => [annal.createdAt.getTime(), annal.id])
          .map(formatAnnalFile),
      );
  });

  const formatAnnalFile = (from: Partial<UeAnnalFile>): JsonLikeVariant<UeAnnalFile> => {
    return {
      ...pick(from, 'id', 'semesterId', 'status', 'sender', 'type', 'ueof'),
      createdAt: from.createdAt,
      updatedAt: from.updatedAt,
    };
  };
});

export default GetAnnal;
