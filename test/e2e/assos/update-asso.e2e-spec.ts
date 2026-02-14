import { Dummies, e2eSuite } from '../../utils/test_utils';
import {
  createAsso,
  createAssoMembership,
  createAssoMembershipPermission,
  createAssoMembershipRole,
  createImageMedia,
  createUser,
} from '../../utils/fakedb';
import * as pactum from 'pactum';
import { ERROR_CODE } from '../../../src/exceptions';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { pick } from '../../../src/utils';

const UpdateAssoE2ESpec = e2eSuite('PATCH /assos/:id', (app) => {
  const userNotAllowed = createUser(app);
  const userAllowed = createUser(app);
  const asso = createAsso(app);
  const assoMembershipRoleInAsso = createAssoMembershipRole(app, { asso });
  const manageInfosPermission = createAssoMembershipPermission(app, { id: 'manage_infos' });
  createAssoMembership(app, {
    asso,
    role: assoMembershipRoleInAsso,
    user: userAllowed,
    permissions: [manageInfosPermission],
  });
  const nonPublicMedia = createImageMedia(app, { isPublic: false, preset: 'AVATAR' });
  const nonAvatarMedia = createImageMedia(app, { isPublic: true, preset: 'CUSTOM' });
  const publicMedia = createImageMedia(app, { isPublic: true, preset: 'AVATAR' });

  const lexicalText = `{"editorState":{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"I want you as a ","type":"text","version":1},{"detail":0,"format":16,"mode":"normal","style":"","text":"lexical","type":"text","version":1},{"detail":0,"format":0,"mode":"normal","style":"","text":" text that passes the ","type":"text","version":1},{"detail":0,"format":1,"mode":"normal","style":"","text":"tests","type":"text","version":1},{"detail":0,"format":0,"mode":"normal","style":"","text":".","type":"text","version":1}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""}],"direction":null,"format":"","indent":0,"type":"root","version":1}},"lastSaved":1760649655570,"source":"Playground","version":"0.37.0"}`;
  const nonLexicalText = 'I want you as a non-lexical text that does not pass the tests.';
  const validBody = {
    name: 'New name',
    email: 'test@utt.fr',
    phoneNumber: '+33325000000',
    website: 'https://www.utt.fr',
    description: { fr: lexicalText },
    descriptionShort: { fr: 'some description' },
  };

  it('should return 403 as user is not authenticated', () =>
    pactum.spec().patch(`/assos/${asso.id}`).withBody(validBody).expectAppError(ERROR_CODE.NOT_LOGGED_IN));

  it('should return a 400 as the asso id param is not valid', () =>
    pactum
      .spec()
      .withBearerToken(userNotAllowed.token)
      .patch(`/assos/thisisnotavaliduuid`)
      .withBody(validBody)
      .expectAppError(ERROR_CODE.PARAM_NOT_UUID, 'assoId'));

  it('should return a 404 as asso is not found', () =>
    pactum
      .spec()
      .withBearerToken(userNotAllowed.token)
      .patch(`/assos/${Dummies.UUID}`)
      .withBody(validBody)
      .expectAppError(ERROR_CODE.NO_SUCH_ASSO, Dummies.UUID));

  it('should return a 403 as user has no permission', () =>
    pactum
      .spec()
      .withBearerToken(userNotAllowed.token)
      .patch(`/assos/${asso.id}`)
      .withBody(validBody)
      .expectAppError(ERROR_CODE.FORBIDDEN_ASSOS_PERMISSIONS, asso.id, manageInfosPermission.id));

  it('should return a 401 as description is non lexical', () =>
    pactum
      .spec()
      .withBearerToken(userAllowed.token)
      .patch(`/assos/${asso.id}`)
      .withBody({ ...validBody, description: { fr: nonLexicalText } })
      .expectAppError(ERROR_CODE.PARAM_LEXICAL_ILLEGAL, 'description.fr'));

  it('should return a 404 as media does not exist', () =>
    pactum
      .spec()
      .withBearerToken(userAllowed.token)
      .patch(`/assos/${asso.id}`)
      .withBody({ ...validBody, logo: Dummies.UUID })
      .expectAppError(ERROR_CODE.NO_SUCH_MEDIA, Dummies.UUID));

  it('should return a 404 as media is not public', () =>
    pactum
      .spec()
      .withBearerToken(userAllowed.token)
      .patch(`/assos/${asso.id}`)
      .withBody({ ...validBody, logo: nonPublicMedia.id })
      .expectAppError(ERROR_CODE.MEDIA_NOT_PUBLIC));

  it('should return a 404 as media does not have correct preset', () =>
    pactum
      .spec()
      .withBearerToken(userAllowed.token)
      .patch(`/assos/${asso.id}`)
      .withBody({ ...validBody, logo: nonAvatarMedia.id })
      .expectAppError(ERROR_CODE.MEDIA_PRESET_REQUIRED, 'AVATAR'));

  it('should update the asso', async () => {
    await pactum
      .spec()
      .withBearerToken(userAllowed.token)
      .patch(`/assos/${asso.id}`)
      .withBody({ ...validBody, logo: publicMedia.id })
      .expectAsso({
        ...asso,
        ...pick(validBody, 'name', 'phoneNumber', 'website'),
        descriptionShortTranslation: validBody.descriptionShort,
        descriptionTranslation: validBody.description,
        mail: validBody.email,
        logoMediaId: publicMedia.id,
      });
    await app()
      .get(PrismaService)
      .asso.update({
        where: { id: asso.id },
        data: {
          ...pick(asso, 'name', 'mail', 'phoneNumber', 'website'),
          logo: { disconnect: true },
          descriptionTranslation: { update: asso.descriptionTranslation },
          descriptionShortTranslation: { update: asso.descriptionShortTranslation },
        },
      });
  });

  it('should update the asso and link media to description and ignore invalid media', async () => {
    const lexicalTextWithImage = `{"editorState":{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"I want you as a ","type":"text","version":1},{"detail":0,"format":16,"mode":"normal","style":"","text":"lexical","type":"text","version":1},{"detail":0,"format":0,"mode":"normal","style":"","text":" text that passes the ","type":"text","version":1},{"detail":0,"format":1,"mode":"normal","style":"","text":"tests","type":"text","version":1},{"detail":0,"format":0,"mode":"normal","style":"","text":" with an image.","type":"text","version":1},{"type":"image","version":1,"altText":"","caption":{"editorState":{"root":{"children":[],"direction":null,"format":"","indent":0,"type":"root","version":1}}},"height":0,"maxWidth":500,"showCaption":false,"src":"https://localhost/media/image/${publicMedia.id}.webp","width":0},{"type":"image","version":1,"altText":"","caption":{"editorState":{"root":{"children":[],"direction":null,"format":"","indent":0,"type":"root","version":1}}},"height":0,"maxWidth":500,"showCaption":false,"src":"https://localhost/media/image/${Dummies.UUID}.webp","width":0}],"direction":null,"format":"","indent":0,"type":"paragraph","version":1,"textFormat":0,"textStyle":""}],"direction":null,"format":"","indent":0,"type":"root","version":1}},"lastSaved":1760652246225,"source":"Playground","version":"0.37.0"}`;
    await pactum
      .spec()
      .withBearerToken(userAllowed.token)
      .patch(`/assos/${asso.id}`)
      .withBody({ ...validBody, description: { fr: lexicalTextWithImage }, logo: publicMedia.id })
      .expectAsso({
        ...asso,
        ...pick(validBody, 'name', 'phoneNumber', 'website'),
        descriptionShortTranslation: validBody.descriptionShort,
        descriptionTranslation: { fr: lexicalTextWithImage },
        mail: validBody.email,
        logoMediaId: publicMedia.id,
      });
    const { descriptionImages } = await app()
      .get(PrismaService)
      .asso.findUnique({ where: { id: asso.id }, include: { descriptionImages: true } });
    expect(descriptionImages.length).toBe(1);
    return app()
      .get(PrismaService)
      .asso.update({
        where: { id: asso.id },
        data: {
          ...pick(asso, 'name', 'mail', 'phoneNumber', 'website'),
          logo: { disconnect: true },
          descriptionImages: { disconnect: { id: publicMedia.id } },
          descriptionTranslation: { update: asso.descriptionTranslation },
          descriptionShortTranslation: { update: asso.descriptionShortTranslation },
        },
      });
  });
});

export default UpdateAssoE2ESpec;
