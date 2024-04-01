import { createUser } from '../../utils/fakedb';
import * as pactum from 'pactum';
import { HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { e2eSuite } from '../../utils/test_utils';

const GetUserProfileE2ESpec = e2eSuite('GET /users/profile', (app) => {
  const user = createUser(app);

  it('should return a 401 as user is not authenticated', () => {
    return pactum.spec().get('/users/profile').expectStatus(HttpStatus.UNAUTHORIZED);
  });

  it('should successfully find the user', async () => {
    const userFromDb = await app()
      .get(PrismaService)
      .user.findUnique({
        where: { login: user.login },
      });
    const expectedBody = {
      id: userFromDb.id,
      firstName: userFromDb.firstName,
      lastName: userFromDb.lastName,
      nickname: userFromDb.infos.nickname,
      avatar: userFromDb.infos.avatar,
      sex: userFromDb.infos.sex,
      nationality: userFromDb.infos.nationality,
      birthday: userFromDb.infos.birthday.toISOString(),
      passions: userFromDb.infos.passions,
      website: userFromDb.infos.website,
      branche: userFromDb.branch === null ? undefined : userFromDb.branch.branch.code,
      semester: userFromDb.branch === null ? undefined : userFromDb.branch.semesterNumber,
      branchOption: userFromDb.branch === null ? undefined : userFromDb.branch.branchOption.code,
      mailUTT: userFromDb.mailsPhones === null ? undefined : userFromDb.mailsPhones.mailUTT,
      mailPersonal: userFromDb.mailsPhones === null ? undefined : userFromDb.mailsPhones.mailPersonal,
      phone: userFromDb.mailsPhones === null ? undefined : userFromDb.mailsPhones.phoneNumber,
      street: userFromDb.addresse === null ? undefined : userFromDb.addresse.street,
      postalCode: userFromDb.addresse === null ? undefined : userFromDb.addresse.postalCode,
      city: userFromDb.addresse === null ? undefined : userFromDb.addresse.city,
      country: userFromDb.addresse === null ? undefined : userFromDb.addresse.country,
      facebook: userFromDb.socialNetwork === null ? undefined : userFromDb.socialNetwork.facebook,
      twitter: userFromDb.socialNetwork === null ? undefined : userFromDb.socialNetwork.twitter,
      instagram: userFromDb.socialNetwork === null ? undefined : userFromDb.socialNetwork.instagram,
      linkedin: userFromDb.socialNetwork === null ? undefined : userFromDb.socialNetwork.linkedin,
      twitch: userFromDb.socialNetwork === null ? undefined : userFromDb.socialNetwork.twitch,
      spotify: userFromDb.socialNetwork === null ? undefined : userFromDb.socialNetwork.spotify,
      discord: userFromDb.socialNetwork === null ? undefined : userFromDb.socialNetwork.pseudoDiscord,
      infoDisplayed: {
        displayBirthday: userFromDb.preference.displayBirthday,
        displayMailPersonal: userFromDb.preference.displayMailPersonal,
        displayPhone: userFromDb.preference.displayPhone,
        displayAddress: userFromDb.preference.displayAddresse,
        displaySex: userFromDb.preference.displaySex,
        displayDiscord: userFromDb.preference.displayDiscord,
        displayTimetable: userFromDb.preference.displayTimetable
      },
    };

    return pactum
      .spec()
      .get(`/users/profile`)
      .withBearerToken(user.token)
      .expectStatus(HttpStatus.OK)
      .expectJson(Object.fromEntries(Object.entries(expectedBody).filter(([, value]) => value !== undefined)));
  });
});

export default GetUserProfileE2ESpec;
