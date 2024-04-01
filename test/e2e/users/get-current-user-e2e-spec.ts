import { e2eSuite } from '../../utils/test_utils';
import { createUser } from '../../utils/fakedb';
import * as pactum from 'pactum';
import { HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../src/prisma/prisma.service';

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
    const branch = userFromDb.branch.find(
      (branch) => branch.semester.start >= new Date() && branch.semester.end <= new Date(),
    );
    const expectedBody = {
      id: userFromDb.id,
      firstName: userFromDb.firstName,
      lastName: userFromDb.lastName,
      nickname: userFromDb.infos.nickname,
      avatar: userFromDb.infos.avatar,
      sex: userFromDb.preference.displaySex ? userFromDb.infos.sex : undefined,
      nationality: userFromDb.infos.nationality,
      birthday: userFromDb.preference.displayBirthday ? userFromDb.infos.birthday : undefined,
      passions: userFromDb.infos.passions,
      website: userFromDb.infos.website,
      branche: branch?.branch.code ?? undefined,
      semestre: branch?.semesterNumber ?? undefined,
      branchOption: branch?.branchOption.code ?? undefined,
      mailUTT: userFromDb.mailsPhones === null ? undefined : userFromDb.mailsPhones.mailUTT,
      mailPersonal:
        userFromDb.preference.displayMailPersonal && !(userFromDb.mailsPhones === null)
          ? userFromDb.mailsPhones.mailPersonal
          : undefined,
      phone:
        userFromDb.preference.displayPhone && !(userFromDb.mailsPhones === null)
          ? userFromDb.mailsPhones.phoneNumber
          : undefined,
      street: userFromDb.preference.displayAddress ? userFromDb.address.street : undefined,
      postalCode: userFromDb.preference.displayAddress ? userFromDb.address.postalCode : undefined,
      city: userFromDb.preference.displayAddress ? userFromDb.address.city : undefined,
      country: userFromDb.preference.displayAddress ? userFromDb.address.country : undefined,
      facebook: userFromDb.socialNetwork === null ? undefined : userFromDb.socialNetwork.facebook,
      twitter: userFromDb.socialNetwork === null ? undefined : userFromDb.socialNetwork.twitter,
      instagram: userFromDb.socialNetwork === null ? undefined : userFromDb.socialNetwork.instagram,
      linkedin: userFromDb.socialNetwork === null ? undefined : userFromDb.socialNetwork.linkedin,
      twitch: userFromDb.socialNetwork === null ? undefined : userFromDb.socialNetwork.twitch,
      spotify: userFromDb.socialNetwork === null ? undefined : userFromDb.socialNetwork.spotify,
      discord:
        userFromDb.preference.displayDiscord && !(userFromDb.socialNetwork === null)
          ? userFromDb.socialNetwork.pseudoDiscord
          : undefined,
    };

    return pactum
      .spec()
      .get(`/users/current`)
      .withBearerToken(user.token)
      .expectStatus(HttpStatus.OK)
      .expectBody(Object.fromEntries(Object.entries(expectedBody).filter(([, value]) => value !== undefined)));
  });
});

export default GetCurrentUserE2ESpec;
