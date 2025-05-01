import * as pactum from 'pactum';
import {
  createUser,
  createBranch,
  createBranchOption,
  createSemester,
  createUe,
  createUeSubscription,
  createAnnalType,
  createUeof,
} from '../../../utils/fakedb';
import { e2eSuite } from '../../../utils/test_utils';
import { ERROR_CODE } from '../../../../src/exceptions';
import { Permission } from '@prisma/client';

const GetAnnalMetadata = e2eSuite('GET /ue/annals/metadata', (app) => {
  const ueUser = createUser(app, { permissions: [Permission.API_SEE_ANNALS] });
  const nonUeUser = createUser(app, { login: 'user2', studentId: 3, permissions: [Permission.API_SEE_ANNALS] });
  const uploader = createUser(app, {
    login: 'user3',
    studentId: 4,
    permissions: [Permission.API_SEE_ANNALS, Permission.API_UPLOAD_ANNALS],
  });
  const userNoPermission = createUser(app);
  const annalType = createAnnalType(app);
  const semester = createSemester(app);
  const branch = createBranch(app);
  const branchOption = createBranchOption(app, { branch });
  const ue = createUe(app);
  const ueof = createUeof(app, { branchOptions: [branchOption], semesters: [semester], ue });
  createUeSubscription(app, { user: ueUser, ueof, semester });

  it('should return a 401 as user is not authenticated', () => {
    return pactum.spec().get(`/ue/annals/metadata`).expectAppError(ERROR_CODE.NOT_LOGGED_IN);
  });

  it('should fail as the user does not have the required permissions', () =>
    pactum
      .spec()
      .withBearerToken(userNoPermission.token)
      .get(`/ue/annals/metadata`)
      .withQueryParams({
        ueCode: ue.code,
      })
      .expectAppError(ERROR_CODE.FORBIDDEN_NOT_ENOUGH_API_PERMISSIONS, 'API_SEE_ANNALS'));

  it('should return a 404 because UE does not exist', () => {
    return pactum
      .spec()
      .withBearerToken(ueUser.token)
      .get(`/ue/annals/metadata`)
      .withQueryParams({
        ueCode: ue.code.slice(0, ue.code.length - 1),
      })
      .expectAppError(ERROR_CODE.NO_SUCH_UE, ue.code.slice(0, ue.code.length - 1));
  });

  it('should return a 403 because user has not already done the ue', () => {
    return pactum
      .spec()
      .withBearerToken(nonUeUser.token)
      .get(`/ue/annals/metadata`)
      .withQueryParams({
        ueCode: ue.code,
      })
      .expectAppError(ERROR_CODE.NOT_ALREADY_DONE_UE);
  });

  it('should return the ue annal metadata (for both uploader and ue member)', async () => {
    await pactum
      .spec()
      .withBearerToken(ueUser.token)
      .get(`/ue/annals/metadata`)
      .withQueryParams({
        ueCode: ue.code,
      })
      .expectUeAnnalMetadata({
        types: [annalType],
        semesters: [semester.code],
      });
    return pactum
      .spec()
      .withBearerToken(uploader.token)
      .get(`/ue/annals/metadata`)
      .withQueryParams({
        ueCode: ue.code,
      })
      .expectUeAnnalMetadata({
        types: [annalType],
        semesters: [semester.code],
      });
  });
});

export default GetAnnalMetadata;
