import { HttpStatus } from '@nestjs/common';
import { e2eSuite } from '../../utils/test_utils';
import * as pactum from 'pactum';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { createUser } from '../../utils/fakedb';

const UpdateProfile = e2eSuite('PATCH /users/current', (app) => {
  const user = createUser(app);

  it('should return a 401 as user is not authenticated', () => {
    return pactum.spec().get('/users/current').expectStatus(HttpStatus.UNAUTHORIZED);
  });

  it('should return a 400 as the type of the value is wrong', async () => {
    await pactum
      .spec()
      .withBearerToken(user.token)
      .patch(`/users/current`)
      .withBody({
        facebook: true,
      })
      .expectStatus(HttpStatus.BAD_REQUEST);
  });

  it('should return the updated profile', async () => {
    await pactum
      .spec()
      .withBearerToken(user.token)
      .patch(`/users/current`)
      .withBody({
        facebook: 'fbProfile',
        displayAddress: true,
      })
      .expectJsonMatchStrict({
        avatar: user.infos.avatar,
        birthday: user.infos.birthday.toISOString(),
        discord: user.socialNetwork.pseudoDiscord,
        facebook: 'fbProfile',
        firstName: user.firstName,
        id: user.id,
        infoDisplayed: {
          displayAddress: true,
          displayBirthday: user.preference.displayBirthday,
          displayDiscord: user.preference.displayDiscord,
          displayMailPersonal: user.preference.displayMailPersonal,
          displayPhone: user.preference.displayPhone,
          displaySex: user.preference.displaySex,
          displayTimetable: user.preference.displayTimetable,
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
