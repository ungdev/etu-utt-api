import { Dummies, e2eSuite } from '../../../utils/test_utils';
import * as fakedb from '../../../utils/fakedb';
import { cpSync, mkdirSync, rmSync } from 'fs';
import { ConfigModule } from '../../../../src/config/config.module';
import { createUser } from '../../../utils/fakedb';
import { ERROR_CODE } from '../../../../src/exceptions';
import * as pactum from 'pactum';

export const GetMediaE2ESpec = e2eSuite('GET /media/image/:mediaId', (app) => {
  const user = createUser(app);
  const publicMedia = fakedb.createImageMedia(app, { isPublic: true });
  const nonPublicMedia = fakedb.createImageMedia(app, { isPublic: false });
  const publicMediaInError = fakedb.createImageMedia(app, { isPublic: true });

  beforeAll(() => {
    mkdirSync(`${app().get(ConfigModule).MEDIA_UPLOAD_DIR}/image`, { recursive: true });
    cpSync(
      `test/e2e/media/image/artifacts/image.webp`,
      `${app().get(ConfigModule).MEDIA_UPLOAD_DIR}/image/${publicMedia.id}.webp`,
    );
    cpSync(
      `test/e2e/media/image/artifacts/image.webp`,
      `${app().get(ConfigModule).MEDIA_UPLOAD_DIR}/image/${nonPublicMedia.id}.webp`,
    );
  });

  afterAll(() => {
    rmSync(app().get(ConfigModule).MEDIA_UPLOAD_DIR.split('/')[0], { recursive: true });
  });

  it('should return a 404 as the media does not exist', () =>
    pactum.spec().get(`/media/image/${Dummies.UUID}`).expectAppError(ERROR_CODE.NO_SUCH_MEDIA, Dummies.UUID));

  it('should return a 401 as the media is not public', () =>
    pactum.spec().get(`/media/image/${nonPublicMedia.id}`).expectAppError(ERROR_CODE.NOT_LOGGED_IN));

  it('should return a 200 and the media (public)', () =>
    pactum
      .spec()
      .get(`/media/image/${publicMedia.id}`)
      .expectStatus(200)
      .expectHeader('content-type', 'image/webp')
      .expectBodyContains('RIFF'));

  it('should return a 200 and the media (not public)', () =>
    pactum
      .spec()
      .withBearerToken(user.token)
      .get(`/media/image/${nonPublicMedia.id}`)
      .expectStatus(200)
      .expectHeader('content-type', 'image/webp')
      .expectBodyContains('RIFF'));

  it('should return a 503 as there is an error reading the file', () =>
    pactum.spec().get(`/media/image/${publicMediaInError.id}`).expectAppError(ERROR_CODE.SERVER_DISK_ERROR));
});
