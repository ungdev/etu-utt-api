import { HttpStatus } from '@nestjs/common';
import { e2eSuite } from '../../../test/utils/test_utils';
import * as pactum from 'pactum';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { createUser } from '../../../test/utils/fakedb';

const UpdateProfile = e2eSuite('PATCH /users/profile', (app) => {
  const user = createUser(app);

  it('should return a 401 as user is not authenticated', () => {
    return pactum.spec().get('/users/profile').expectStatus(HttpStatus.UNAUTHORIZED);
  });

  it('should return a 400 as the type of the value is wrong', async () => {
    await pactum
      .spec()
      .withBearerToken(user.token)
      .patch(`/users/profile`)
      .withBody({
        facebook: true,
      })
      .expectStatus(HttpStatus.BAD_REQUEST);
  });

  it('should return the updated profile', async () => {
    await pactum
      .spec()
      .withBearerToken(user.token)
      .patch(`/users/profile`)
      .withBody({
        facebook: 'fbProfile',
        displayAddresse: true,
      })
      .expectJson({
        avatar: user.avatar,
        birthday: user.birthday.toISOString(),
        city: user.city,
        country: user.country,
        discord: user.pseudoDiscord,
        facebook: 'fbProfile',
        firstName: user.firstName,
        id: user.id,
        infoDisplayed: {
          displayAddresse: true,
          displayBirthday: user.displayBirthday,
          displayDiscord: user.displayDiscord,
          displayMailPersonal: user.displayMailPersonal,
          displayPhone: user.displayPhone,
          displaySex: user.displaySex,
        },
        instagram: user.instagram,
        lastName: user.lastName,
        linkedin: user.linkedin,
        mailPersonal: user.mailPersonal,
        mailUTT: user.mailUTT,
        nationality: user.nationality,
        nickName: user.nickname,
        passions: user.passions,
        phone: user.phoneNumber,
        postalCode: user.postalCode,
        sex: user.sex,
        spotify: user.spotify,
        street: user.street,
        twitch: user.twitch,
        twitter: user.website,
        website: user.website,
      });
    return app().get(PrismaService).user.deleteMany();
  });
});

export default UpdateProfile;
