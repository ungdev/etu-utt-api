import { e2eSuite } from '../../utils/test_utils';
import { createUser } from '../../utils/fakedb';
import * as pactum from 'pactum';
import { HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../src/prisma/prisma.service';

const GetUserE2ESpec = e2eSuite('GET /users/:userId', (app) => {
  const user = createUser(app);
  const userToSearch = createUser(app, {
    login: 'userToSearch',
    id: 'oui',
  });

  it('should return a 401 as user is not authenticated', () => {
    return pactum.spec().get(`/users/${userToSearch.id}`).expectStatus(HttpStatus.UNAUTHORIZED);
  });

  it('should return a 404 as user was not found', () => {
    return pactum.spec().get('/users/abcdef').withBearerToken(user.token).expectStatus(HttpStatus.NOT_FOUND);
  });

  it('should successfully find the user', async () => {
    const userFromDb = await app()
      .get(PrismaService)
      .user.findUnique({
        where: { login: userToSearch.login },
      });
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
      branche: userFromDb.branch === null ? undefined : userFromDb.branch.branch.code,
      semestre: userFromDb.branch === null ? undefined : userFromDb.branch.semesterNumber,
      filiere: userFromDb.branch === null ? undefined : userFromDb.branch.branchOption.code,
      mailUTT: userFromDb.mailsPhones === null ? undefined : userFromDb.mailsPhones.mailUTT,
      mailPersonal:
        userFromDb.preference.displayMailPersonal && !(userFromDb.mailsPhones === null)
          ? userFromDb.mailsPhones.mailPersonal
          : undefined,
      phone:
        userFromDb.preference.displayPhone && !(userFromDb.mailsPhones === null)
          ? userFromDb.mailsPhones.phoneNumber
          : undefined,
      street: userFromDb.preference.displayAddresse ? userFromDb.addresse.street : undefined,
      postalCode: userFromDb.preference.displayAddresse ? userFromDb.addresse.postalCode : undefined,
      city: userFromDb.preference.displayAddresse ? userFromDb.addresse.city : undefined,
      country: userFromDb.preference.displayAddresse ? userFromDb.addresse.country : undefined,
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
      .get(`/users/${userFromDb.id}`)
      .withBearerToken(user.token)
      .expectStatus(HttpStatus.OK)
      .expectBody(Object.fromEntries(Object.entries(expectedBody).filter(([, value]) => value !== undefined)));
  });
});

export default GetUserE2ESpec;