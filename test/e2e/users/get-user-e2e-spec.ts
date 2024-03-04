import { createUser, suite } from '../../test_utils';
import * as pactum from 'pactum';
import { HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../src/prisma/prisma.service';

const GetUserE2ESpec = suite('GET /users/{userId}', (app) => {
  const user = createUser(app);
  const userToSearch = createUser(app, { login: 'userToSearch', studentId: 2 });

  it('should return a 401 as user is not authenticated', () => {
    return pactum
      .spec()
      .get('/users/abcdef')
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
        where: { login: userToSearch.login },
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
      sex: userFromDb.preference.displaySex ? userFromDb.infos.sex : undefined,
      nationality: userFromDb.infos.nationality,
      birthday: userFromDb.preference.displayBirthday
        ? userFromDb.infos.birthday
        : undefined,
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
        userFromDb.preference.displayMailPersonal &&
        !(userFromDb.mailsPhones === null)
          ? userFromDb.mailsPhones.mailPersonal
          : undefined,
      phone:
        userFromDb.preference.displayPhone && !(userFromDb.mailsPhones === null)
          ? userFromDb.mailsPhones.phoneNumber
          : undefined,
      street: userFromDb.preference.displayAddresse
        ? userFromDb.addresse.street
        : undefined,
      postalCode: userFromDb.preference.displayAddresse
        ? userFromDb.addresse.postalCode
        : undefined,
      city: userFromDb.preference.displayAddresse
        ? userFromDb.addresse.city
        : undefined,
      country: userFromDb.preference.displayAddresse
        ? userFromDb.addresse.country
        : undefined,
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
        userFromDb.preference.displayDiscord &&
        !(userFromDb.socialNetwork === null)
          ? userFromDb.socialNetwork.pseudoDiscord
          : undefined,
    };

    return pactum
      .spec()
      .get(`/users/${expectedBody.id}`)
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

export default GetUserE2ESpec;
