import { Dummies, e2eSuite } from '../../utils/test_utils';
import * as pactum from 'pactum';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { createImageMedia, createUser } from '../../utils/fakedb';
import { ERROR_CODE } from '../../../src/exceptions';
import { ImageMediaPreset } from '@prisma/client';

const UpdateProfile = e2eSuite('PATCH /users/current', (app) => {
  const user = createUser(app);
  const image = createImageMedia(app, { preset: ImageMediaPreset.CUSTOM });

  it('should return a 401 as user is not authenticated', () => {
    return pactum.spec().get('/users/current').expectAppError(ERROR_CODE.NOT_LOGGED_IN);
  });

  it('should return a 400 as the type of the value is wrong', async () => {
    await pactum
      .spec()
      .withBearerToken(user.token)
      .patch(`/users/current`)
      .withBody({
        facebook: true,
      })
      .expectAppError(ERROR_CODE.PARAM_NOT_STRING, 'facebook');
  });

  it('should return a 400 as no field was provided', async () => {
    await pactum
      .spec()
      .withBearerToken(user.token)
      .patch(`/users/current`)
      .withBody({})
      .expectAppError(ERROR_CODE.NO_FIELD_PROVIDED);
  });

  it('should return a 404 as media does not exist', async () => {
    await pactum
      .spec()
      .withBearerToken(user.token)
      .patch(`/users/current`)
      .withBody({
        avatar: Dummies.UUID,
      })
      .expectAppError(ERROR_CODE.NO_SUCH_MEDIA, Dummies.UUID);
  });

  it('should return a 403 as image has wrong preset', async () => {
    await pactum
      .spec()
      .withBearerToken(user.token)
      .patch(`/users/current`)
      .withBody({
        avatar: image.id,
      })
      .expectAppError(ERROR_CODE.MEDIA_PRESET_REQUIRED, ImageMediaPreset.AVATAR);
  });

  it('should return the updated profile', async () => {
    await pactum
      .spec()
      .withBearerToken(user.token)
      .patch(`/users/current`)
      .withBody({
        facebook: 'fbProfile',
        displayAddress: 'ALL_PUBLIC',
      })
      .$expectRegexableJson({
        avatar: user.infos.avatarMediaId ? `/media/image/${user.infos.avatarMediaId}.webp` : null,
        birthday: user.infos.birthday,
        discord: user.socialNetwork.discord,
        facebook: 'fbProfile',
        firstName: user.firstName,
        id: user.id,
        type: user.userType,
        infoDisplayed: {
          displayAddress: 'ALL_PUBLIC',
          displayBirthday: user.privacy.birthday,
          displayDiscord: user.privacy.discord,
          displayMailPersonal: user.privacy.mailPersonal,
          displayPhone: user.privacy.phoneNumber,
          displaySex: user.privacy.sex,
          displayTimetable: user.privacy.timetable,
        },
        instagram: user.socialNetwork.instagram,
        lastName: user.lastName,
        linkedin: user.socialNetwork.linkedin,
        mailPersonal: user.mailsPhones.mailPersonal,
        mailUTT: user.mailsPhones.mailUTT,
        nationality: user.infos.nationality,
        nickname: user.infos.nickname,
        passions: user.infos.passions,
        phone: user.mailsPhones.phoneNumber,
        addresses: user.addresses.map((address) => ({
          city: address.city,
          country: address.country,
          postalCode: address.postalCode,
          street: address.street,
        })),
        sex: user.infos.sex,
        spotify: user.socialNetwork.spotify,
        twitch: user.socialNetwork.twitch,
        twitter: user.socialNetwork.twitter,
        website: user.infos.website,
      });
    return app()
      .get(PrismaService)
      .user.update({ where: { id: user.id }, data: { socialNetwork: { update: { facebook: null } } } });
  });
});

export default UpdateProfile;
