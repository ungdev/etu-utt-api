import * as pactum from 'pactum';
import {
  createUser,
  createBranch,
  createBranchOption,
  createSemester,
  createUE,
  createUESubscription,
  createAnnalType,
} from '../../utils/fakedb';
import { JsonLike, e2eSuite } from '../../utils/test_utils';
import { ERROR_CODE } from '../../../src/exceptions';
import { CommentStatus } from 'src/ue/interfaces/comment.interface';
import { pick } from '../../../src/utils';
import { mkdirSync, rmSync } from 'fs';

const PostAnnal = e2eSuite('POST-PUT /ue/{ueCode}/annals', (app) => {
  const senderUser = createUser(app);
  const nonUeUser = createUser(app, { login: 'user2', studentId: 2 });
  const nonStudentUser = createUser(app, { login: 'nonStudent', studentId: 4, role: 'TEACHER' });
  const annalType = createAnnalType(app);
  const semester = createSemester(app);
  const branch = createBranch(app);
  const branchOption = createBranchOption(app, { branch });
  const ue = createUE(app, { semesters: [semester], branchOption });
  createUESubscription(app, { user: senderUser, ue, semester });

  it('should return a 401 as user is not authenticated', () => {
    return pactum.spec().post(`/ue/${ue.code}/annals`).expectAppError(ERROR_CODE.NOT_LOGGED_IN);
  });

  it('should return a 404 because UE does not exist', () => {
    return pactum
      .spec()
      .withBearerToken(senderUser.token)
      .post(`/ue/${ue.code.slice(0, ue.code.length - 1)}/annals`)
      .withBody({
        semester: semester.code,
        typeId: annalType.id,
      })
      .expectAppError(ERROR_CODE.NO_SUCH_UE, ue.code.slice(0, ue.code.length - 1));
  });

  it('should return a 403 because user is not a student', () => {
    return pactum
      .spec()
      .withBearerToken(nonStudentUser.token)
      .post(`/ue/${ue.code}/annals`)
      .withBody({
        semester: semester.code,
        typeId: annalType.id,
      })
      .expectAppError(ERROR_CODE.FORBIDDEN_INVALID_ROLE, 'STUDENT');
  });

  it('should return a 403 because user has not done the UE', () => {
    return pactum
      .spec()
      .withBearerToken(nonUeUser.token)
      .post(`/ue/${ue.code}/annals`)
      .withBody({
        semester: semester.code,
        typeId: annalType.id,
      })
      .expectAppError(ERROR_CODE.NOT_DONE_UE_IN_SEMESTER, ue.code, semester.code);
  });

  describe('should create the annal', () => {
    beforeAll(() => {
      mkdirSync('uploads/exams', { recursive: true });
    });

    afterAll(() => {
      rmSync('uploads', { recursive: true });
    });

    const testFunction =
      (fileExt: 'pdf' | 'png' | 'jpg' | 'avif' | 'tiff' | 'webp', rotation: 1 | 0 | -1) => async () => {
        const ueAnnalFile = (
          await pactum
            .spec()
            .withBearerToken(senderUser.token)
            .post(`/ue/${ue.code}/annals`)
            .withBody({
              semester: semester.code,
              typeId: annalType.id,
            })
            .expectUEAnnal(
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
          .put(`/ue/${ue.code}/annals/${ueAnnalFile.id}?rotate=${rotation}`)
          .withFile('file', `test/e2e/ue/artifacts/annal.${fileExt}`)
          .expectUEAnnal({
            ...pick(ueAnnalFile, 'id', 'semesterId', 'type', 'status', 'sender', 'createdAt', 'createdAt'),
          });
      };
    it('from a pdf', testFunction('pdf', 0));
    it('from a png', testFunction('png', 1));
    it('from a jpg', testFunction('jpg', -1));
    it('from a webp', testFunction('webp', 0));
    it('from a avif', testFunction('avif', 1));
    it('not from a gif', async () => {
      const ueAnnalFile = (
        await pactum
          .spec()
          .withBearerToken(senderUser.token)
          .post(`/ue/${ue.code}/annals`)
          .withBody({
            semester: semester.code,
            typeId: annalType.id,
          })
          .expectUEAnnal(
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
        .put(`/ue/${ue.code}/annals/${ueAnnalFile.id}?rotate=0`)
        .withFile('file', `test/e2e/ue/artifacts/annal.gif`)
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
          .post(`/ue/${ue.code}/annals`)
          .withBody({
            semester: semester.code,
            typeId: annalType.id,
          })
          .expectUEAnnal(
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
        .put(`/ue/${ue.code}/annals/${ueAnnalFile.id}?rotate=0`)
        .withFile('file', `test/e2e/ue/artifacts/annal.png.gif`)
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
          .post(`/ue/${ue.code}/annals`)
          .withBody({
            semester: semester.code,
            typeId: annalType.id,
          })
          .expectUEAnnal(
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
        .put(`/ue/${ue.code}/annals/${ueAnnalFile.id}?rotate=0`)
        .expectAppError(ERROR_CODE.NO_FILE_PROVIDED);
    });
    it('but not allow because ue does not exist', async () => {
      const ueAnnalFile = (
        await pactum
          .spec()
          .withBearerToken(senderUser.token)
          .post(`/ue/${ue.code}/annals`)
          .withBody({
            semester: semester.code,
            typeId: annalType.id,
          })
          .expectUEAnnal(
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
        .put(`/ue/${ue.code.slice(0, ue.code.length - 1)}0/annals/${ueAnnalFile.id}?rotate=0`)
        .withFile('file', `test/e2e/ue/artifacts/annal.png`)
        .expectAppError(ERROR_CODE.NO_SUCH_UE, `${ue.code.slice(0, ue.code.length - 1)}0`);
    });
    it('but not allow because user is not the sender', async () => {
      const ueAnnalFile = (
        await pactum
          .spec()
          .withBearerToken(senderUser.token)
          .post(`/ue/${ue.code}/annals`)
          .withBody({
            semester: semester.code,
            typeId: annalType.id,
          })
          .expectUEAnnal(
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
        .put(`/ue/${ue.code}/annals/${ueAnnalFile.id}?rotate=0`)
        .withFile('file', `test/e2e/ue/artifacts/annal.png`)
        .expectAppError(ERROR_CODE.NOT_ANNAL_SENDER);
    });
  });
});

export default PostAnnal;
