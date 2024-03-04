import { createUser, suite } from '../../test_utils';
import * as pactum from 'pactum';
import { HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../src/prisma/prisma.service';

const GetCurrentUserE2ESpec = suite('GET /users/current', (app) => {
  const user = createUser(app);

  it('should return a 401 as user is not authenticated', () => {
    return pactum
      .spec()
      .get('/users/current')
      .expectStatus(HttpStatus.UNAUTHORIZED);
  });

  it('should return a 404 as user was not found', () => {
    return pactum
      .spec()
      .get('/users/abcdef')
      .withBearerToken(user.token)
      .expectStatus(HttpStatus.NOT_FOUND);
  });

  it('should successfully find the user', async () => {
    const userFromDb = await app()
      .get(PrismaService)
      .user.findUnique({
        where: { login: user.login },
        include: {
          infos: true,
          branche: true,
          mailsPhones: true,
          socialNetwork: true,
          preference: true,
          addresse: true,
        },
      });
    const expectedBody = {
      id: userFromDb.id,
      firstName: userFromDb.firstName,
      lastName: userFromDb.lastName,
      nickName: userFromDb.infos.nickname,
      avatar: userFromDb.infos.avatar,
      sex: userFromDb.infos.sex,
      nationality: userFromDb.infos.nationality,
      birthday: userFromDb.infos.birthday,
      passions: userFromDb.infos.passions,
      website: userFromDb.infos.website,
      branche:
        userFromDb.branche === null ? undefined : userFromDb.branche.brancheId,
      semestre:
        userFromDb.branche === null
          ? undefined
          : userFromDb.branche.semesterNumber,
      filiere:
        userFromDb.branche === null ? undefined : userFromDb.branche.filiereId,
      mailUTT:
        userFromDb.mailsPhones === null
          ? undefined
          : userFromDb.mailsPhones.mailUTT,
      mailPersonal:
        userFromDb.mailsPhones === null
          ? undefined
          : userFromDb.mailsPhones.mailPersonal,
      phone:
        userFromDb.mailsPhones === null
          ? undefined
          : userFromDb.mailsPhones.phoneNumber,
      street: userFromDb.addresse.street,
      postalCode: userFromDb.addresse.postalCode,
      city: userFromDb.addresse.city,
      country: userFromDb.addresse.country,
      facebook:
        userFromDb.socialNetwork === null
          ? undefined
          : userFromDb.socialNetwork.facebook,
      twitter:
        userFromDb.socialNetwork === null
          ? undefined
          : userFromDb.socialNetwork.twitter,
      instagram:
        userFromDb.socialNetwork === null
          ? undefined
          : userFromDb.socialNetwork.instagram,
      linkendIn:
        userFromDb.socialNetwork === null
          ? undefined
          : userFromDb.socialNetwork.linkedin,
      twitch:
        userFromDb.socialNetwork === null
          ? undefined
          : userFromDb.socialNetwork.twitch,
      spotify:
        userFromDb.socialNetwork === null
          ? undefined
          : userFromDb.socialNetwork.spotify,
      discord:
        userFromDb.socialNetwork === null
          ? undefined
          : userFromDb.socialNetwork.pseudoDiscord,
      infoDisplayed: {
        displayBirthday: userFromDb.preference.displayBirthday,
        displayMailPersonal: userFromDb.preference.displayMailPersonal,
        displayPhone: userFromDb.preference.displayPhone,
        displayAddresse: userFromDb.preference.displayAddresse,
        displaySex: userFromDb.preference.displaySex,
        displayDiscord: userFromDb.preference.displayDiscord,
      },
    };

    return pactum
      .spec()
      .get(`/users/current`)
      .withBearerToken(user.token)
      .expectStatus(HttpStatus.OK)
      .expectBody(
        Object.fromEntries(
          Object.entries(expectedBody).filter(
            ([, value]) => value !== undefined,
          ),
        ),
      );
  });
});

export default GetCurrentUserE2ESpec;
