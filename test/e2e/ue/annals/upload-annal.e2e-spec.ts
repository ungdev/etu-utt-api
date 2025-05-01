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
import { JsonLike, e2eSuite } from '../../../utils/test_utils';
import { ERROR_CODE } from '../../../../src/exceptions';
import { ConfigModule } from '../../../../src/config/config.module';
import { CommentStatus } from 'src/ue/comments/interfaces/comment.interface';
import { pick } from '../../../../src/utils';
import { mkdirSync, rmSync } from 'fs';

const PostAnnal = e2eSuite('POST-PUT /ue/annals', (app) => {
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

  it('should return a 401 as user is not authenticated', () => {
    return pactum.spec().post(`/ue/annals`).expectAppError(ERROR_CODE.NOT_LOGGED_IN);
  });

  it('should fail as the user does not have the required permissions', () =>
    pactum
      .spec()
      .withBearerToken(userNoPermission.token)
      .post(`/ue/annals`)
      .withBody({
        semester: semester.code,
        typeId: annalType.id,
        ueCode: ue.code.slice(0, ue.code.length - 1),
      })
      .expectAppError(ERROR_CODE.FORBIDDEN_NOT_ENOUGH_API_PERMISSIONS, 'API_UPLOAD_ANNALS'));

  it('should return a 404 because UE does not exist', () => {
    return pactum
      .spec()
      .withBearerToken(senderUser.token)
      .post(`/ue/annals`)
      .withBody({
        semester: semester.code,
        typeId: annalType.id,
        ueCode: ue.code.slice(0, ue.code.length - 1),
      })
      .expectAppError(ERROR_CODE.NO_SUCH_UE, ue.code.slice(0, ue.code.length - 1));
  });

  it('should return a 403 because user has not done the UE', () => {
    return pactum
      .spec()
      .withBearerToken(nonUeUser.token)
      .post(`/ue/annals`)
      .withBody({
        semester: semester.code,
        typeId: annalType.id,
        ueCode: ue.code,
      })
      .expectAppError(ERROR_CODE.NOT_DONE_UE_IN_SEMESTER, ue.code, semester.code);
  });

  describe('should create the annal', () => {
    beforeAll(() => {
      mkdirSync(app().get(ConfigModule).ANNAL_UPLOAD_DIR, { recursive: true });
    });

    afterAll(() => {
      rmSync(app().get(ConfigModule).ANNAL_UPLOAD_DIR.split('/')[0], { recursive: true });
    });

    const testFunction =
      (fileExt: 'pdf' | 'png' | 'jpg' | 'avif' | 'tiff' | 'webp', rotation: 0 | 1 | 2 | 3) => async () => {
        const ueAnnalFile = (
          await pactum
            .spec()
            .withBearerToken(senderUser.token)
            .post(`/ue/annals`)
            .withBody({
              semester: semester.code,
              typeId: annalType.id,
              ueCode: ue.code,
            })
            .expectUeAnnal(
              {
                id: JsonLike.ANY_UUID,
                createdAt: JsonLike.ANY_DATE,
                updatedAt: JsonLike.ANY_DATE,
                semesterId: semester.code,
                type: annalType,
                status: CommentStatus.PROCESSING,
                sender: pick(senderUser, 'id', 'firstName', 'lastName'),
              },
              true,
            )
        ).body;
        return pactum
          .spec()
          .withBearerToken(senderUser.token)
          .put(`/ue/annals/${ueAnnalFile.id}?rotate=${rotation}`)
          .withFile('file', `test/e2e/ue/annals/artifacts/annal.${fileExt}`)
          .expectUeAnnal({
            ...pick(ueAnnalFile, 'id', 'semesterId', 'type', 'status', 'sender', 'createdAt', 'createdAt'),
          });
      };
    it('from a pdf', testFunction('pdf', 0));
    it('from a png', testFunction('png', 1));
    it('from a jpg', testFunction('jpg', 2));
    it('from a webp', testFunction('webp', 3));
    it('from a avif', testFunction('avif', 0));
    it('not from a gif', async () => {
      const ueAnnalFile = (
        await pactum
          .spec()
          .withBearerToken(senderUser.token)
          .post(`/ue/annals`)
          .withBody({
            semester: semester.code,
            typeId: annalType.id,
            ueCode: ue.code,
          })
          .expectUeAnnal(
            {
              id: JsonLike.ANY_UUID,
              createdAt: JsonLike.ANY_DATE,
              updatedAt: JsonLike.ANY_DATE,
              semesterId: semester.code,
              type: annalType,
              status: CommentStatus.PROCESSING,
              sender: pick(senderUser, 'id', 'firstName', 'lastName'),
            },
            true,
          )
      ).body;
      return pactum
        .spec()
        .withBearerToken(senderUser.token)
        .put(`/ue/annals/${ueAnnalFile.id}?rotate=0`)
        .withFile('file', `test/e2e/ue/annals/artifacts/annal.gif`)
        .expectAppError(
          ERROR_CODE.FILE_INVALID_TYPE,
          'application/pdf, image/png, image/jpeg, image/webp, image/avif, image/tiff',
        );
    });
    it('not from a fake png', async () => {
      const ueAnnalFile = (
        await pactum
          .spec()
          .withBearerToken(senderUser.token)
          .post(`/ue/annals`)
          .withBody({
            semester: semester.code,
            typeId: annalType.id,
            ueCode: ue.code,
          })
          .expectUeAnnal(
            {
              id: JsonLike.ANY_UUID,
              createdAt: JsonLike.ANY_DATE,
              updatedAt: JsonLike.ANY_DATE,
              semesterId: semester.code,
              type: annalType,
              status: CommentStatus.PROCESSING,
              sender: pick(senderUser, 'id', 'firstName', 'lastName'),
            },
            true,
          )
      ).body;
      return pactum
        .spec()
        .withBearerToken(senderUser.token)
        .put(`/ue/annals/${ueAnnalFile.id}?rotate=0`)
        .withFile('file', `test/e2e/ue/annals/artifacts/annal.png.gif`)
        .expectAppError(
          ERROR_CODE.FILE_INVALID_TYPE,
          'application/pdf, image/png, image/jpeg, image/webp, image/avif, image/tiff',
        );
    });
    it('but not allow missing files', async () => {
      const ueAnnalFile = (
        await pactum
          .spec()
          .withBearerToken(senderUser.token)
          .post(`/ue/annals`)
          .withBody({
            semester: semester.code,
            typeId: annalType.id,
            ueCode: ue.code,
          })
          .expectUeAnnal(
            {
              id: JsonLike.ANY_UUID,
              createdAt: JsonLike.ANY_DATE,
              updatedAt: JsonLike.ANY_DATE,
              semesterId: semester.code,
              type: annalType,
              status: CommentStatus.PROCESSING,
              sender: pick(senderUser, 'id', 'firstName', 'lastName'),
            },
            true,
          )
      ).body;
      return pactum
        .spec()
        .withBearerToken(senderUser.token)
        .put(`/ue/annals/${ueAnnalFile.id}?rotate=0`)
        .expectAppError(ERROR_CODE.NO_FILE_PROVIDED);
    });
    it('but not allow because user is not the sender', async () => {
      const ueAnnalFile = (
        await pactum
          .spec()
          .withBearerToken(senderUser.token)
          .post(`/ue/annals`)
          .withBody({
            semester: semester.code,
            typeId: annalType.id,
            ueCode: ue.code,
          })
          .expectUeAnnal(
            {
              id: JsonLike.ANY_UUID,
              createdAt: JsonLike.ANY_DATE,
              updatedAt: JsonLike.ANY_DATE,
              semesterId: semester.code,
              type: annalType,
              status: CommentStatus.PROCESSING,
              sender: pick(senderUser, 'id', 'firstName', 'lastName'),
            },
            true,
          )
      ).body;
      return pactum
        .spec()
        .withBearerToken(nonUeUser.token)
        .put(`/ue/annals/${ueAnnalFile.id}?rotate=0`)
        .withFile('file', `test/e2e/ue/annals/artifacts/annal.png`)
        .expectAppError(ERROR_CODE.NOT_ANNAL_SENDER);
    });
  });
});

export default PostAnnal;
