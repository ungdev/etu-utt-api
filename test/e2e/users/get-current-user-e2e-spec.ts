import { e2eSuite } from '../../utils/test_utils';
import { createUser } from '../../utils/fakedb';
import * as pactum from 'pactum';
import { HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { pick } from '../../../src/utils';
import { deepDateToString } from '../../declarations';

const GetCurrentUserE2ESpec = e2eSuite('GET /users/current', (app) => {
  const user = createUser(app);

  it('should return a 401 as user is not authenticated', () => {
    return pactum.spec().get(`/users/current`).expectStatus(HttpStatus.UNAUTHORIZED);
  });

  it('should successfully find the user', async () => {
    const userFromDb = await app()
      .get(PrismaService)
      .user.findUnique({
        where: { login: user.login },
      });
    const branch = userFromDb.branchSubscriptions.find(
      (branch) => branch.semester.start >= new Date() && branch.semester.end <= new Date(),
    );
    const expectedBody = deepDateToString({
      id: userFromDb.id,
      firstName: userFromDb.firstName,
      lastName: userFromDb.lastName,
      nickname: userFromDb.infos.nickname,
      type: userFromDb.userType,
      avatar: userFromDb.infos.avatar,
      sex: userFromDb.infos.sex,
      nationality: userFromDb.infos.nationality,
      birthday: userFromDb.infos.birthday,
      passions: userFromDb.infos.passions,
      website: userFromDb.infos.website,
      branch: branch?.branchOption.branch.code,
      semester: branch?.semesterNumber,
      branchOption: branch?.branchOption.code,
      mailUTT: userFromDb.mailsPhones.mailUTT,
      mailPersonal: userFromDb.mailsPhones.mailPersonal,
      phone: userFromDb.mailsPhones.phoneNumber,
      addresses: userFromDb.addresses.map((address) => pick(address, 'postalCode', 'city', 'country', 'street')),
      facebook: userFromDb.socialNetwork.facebook,
      twitter: userFromDb.socialNetwork.twitter,
      instagram: userFromDb.socialNetwork.instagram,
      linkedin: userFromDb.socialNetwork.linkedin,
      twitch: userFromDb.socialNetwork.twitch,
      spotify: userFromDb.socialNetwork.spotify,
      discord: userFromDb.socialNetwork.pseudoDiscord,
      infoDisplayed: {
        displayBirthday: userFromDb.preference.displayBirthday,
        displayMailPersonal: userFromDb.preference.displayMailPersonal,
        displayPhone: userFromDb.preference.displayPhone,
        displayAddress: userFromDb.preference.displayAddress,
        displaySex: userFromDb.preference.displaySex,
        displayDiscord: userFromDb.preference.displayDiscord,
        displayTimetable: userFromDb.preference.displayTimetable,
      },
    });

    return pactum
      .spec()
      .get(`/users/current`)
      .withBearerToken(user.token)
      .expectStatus(HttpStatus.OK)
      .expectJsonMatchStrict(
        Object.fromEntries(Object.entries(expectedBody).filter(([, value]) => value !== undefined)),
      );
  });
});

export default GetCurrentUserE2ESpec;
