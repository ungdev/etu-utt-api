import { ImageMediaPreset } from '@/prisma/types';
import { mkdirSync, rmSync } from 'fs';
import { ERROR_CODE } from '@/exceptions';
import { createUser } from '#/utils/fakedb';
import { e2eSuite, JsonLike } from '#/utils/test_utils';
import { ConfigModule } from '@/config/config.module';
import { PermissionManager } from '@/utils';
import * as pactum from 'pactum';

export const UploadMediaE2ESpec = e2eSuite('POST /media/image', (app) => {
  const user = createUser(app, { permissions: new PermissionManager().with('API_UPLOAD_MEDIA') });
  const unauthorizedUser = createUser(app);

  const params = {
    public: true,
    preset: ImageMediaPreset.AVATAR,
    rotation: 1,
    effort: 2,
    quality: 100,
    width: 150,
    height: 150,
  };

  it('should return a 401 as user is not authenticated', () => {
    return pactum.spec().post(`/media/image`).expectAppError(ERROR_CODE.NOT_LOGGED_IN);
  });

  it('should fail as the user does not have the required permissions', () =>
    pactum
      .spec()
      .withBearerToken(unauthorizedUser.token)
      .post(`/media/image`)
      .withQueryParams(params)
      .withFile('file', `test/e2e/media/image/artifacts/image.png`)
      .expectAppError(ERROR_CODE.FORBIDDEN_NOT_ENOUGH_API_PERMISSIONS, 'API_UPLOAD_MEDIA'));

  it('should fail as directory does not exist', () =>
    pactum
      .spec()
      .withBearerToken(user.token)
      .post(`/media/image`)
      .withQueryParams(params)
      .withFile('file', `test/e2e/media/image/artifacts/image.webp`)
      .expectAppError(ERROR_CODE.SERVER_DISK_ERROR));

  describe('should create the annal', () => {
    beforeAll(() => {
      mkdirSync(`${app().get(ConfigModule).MEDIA_UPLOAD_DIR}/image`, { recursive: true });
    });

    afterAll(() => {
      rmSync(app().get(ConfigModule).MEDIA_UPLOAD_DIR.split('/')[0], { recursive: true });
    });

    const testFunction = (fileExt: 'png' | 'jpg' | 'avif' | 'tif' | 'webp', rotation: 0 | 1 | 2 | 3) => async () => {
      return pactum
        .spec()
        .withBearerToken(user.token)
        .post(`/media/image`)
        .withQueryParams({ ...params, rotation })
        .withFile('file', `test/e2e/media/image/artifacts/image.${fileExt}`)
        .expectImageMedia({
          width: 256,
          height: 256,
          isPublic: params.public,
          preset: params.preset,
          size: JsonLike.INT,
          id: JsonLike.UUID,
        });
    };

    it('from a tiff', testFunction('tif', 0));
    it('from a png', testFunction('png', 1));
    it('from a jpg', testFunction('jpg', 2));
    it('from a webp', testFunction('webp', 3));
    it('from a avif', testFunction('avif', 0));

    it('should upscale to 1080p', async () => {
      return pactum
        .spec()
        .withBearerToken(user.token)
        .post(`/media/image`)
        .withQueryParams({
          ...params,
          preset: 'CUSTOM',
          width: 1920,
          height: 1080,
        })
        .withFile('file', `test/e2e/media/image/artifacts/image.png`)
        .expectImageMedia({
          width: 1920,
          height: 1080,
          isPublic: params.public,
          preset: 'CUSTOM',
          size: JsonLike.INT,
          id: JsonLike.UUID,
        });
    });

    it('should not upscale to more than 1080p', async () => {
      return pactum
        .spec()
        .withBearerToken(user.token)
        .post(`/media/image`)
        .withQueryParams({
          ...params,
          preset: 'CUSTOM',
          width: 1921,
          height: 1081,
        })
        .withFile('file', `test/e2e/media/image/artifacts/image.png`)
        .expectAppError(ERROR_CODE.PARAM_TOO_HIGH, 'height, width');
    });

    it('not from a gif', async () => {
      return pactum
        .spec()
        .withBearerToken(user.token)
        .post(`/media/image`)
        .withQueryParams(params)
        .withFile('file', `test/e2e/media/image/artifacts/image.gif`)
        .expectAppError(ERROR_CODE.FILE_INVALID_TYPE, 'image/png, image/jpeg, image/webp, image/avif, image/tiff');
    });
    it('not from a fake png', async () => {
      return pactum
        .spec()
        .withBearerToken(user.token)
        .post(`/media/image`)
        .withQueryParams(params)
        .withFile('file', `test/e2e/media/image/artifacts/image.gif.png`)
        .expectAppError(ERROR_CODE.FILE_INVALID_TYPE, 'image/png, image/jpeg, image/webp, image/avif, image/tiff');
    });
    it('but not allow missing files', async () => {
      return pactum
        .spec()
        .withBearerToken(user.token)
        .post(`/media/image`)
        .withQueryParams(params)
        .expectAppError(ERROR_CODE.NO_FILE_PROVIDED);
    });
  });
});
