import { e2eSuite } from '../../utils/test_utils';
import { createUser } from '../../utils/fakedb';
import * as pactum from 'pactum';
import { HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../src/prisma/prisma.service';

const GetUserE2ESpec = e2eSuite('GET /users/:userId', (app) => {
  const user = createUser(app);
  const userToSearch = createUser(app);

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
    const branch = userFromDb.branchSubscriptions.find(
      (branch) => branch.semester.start >= new Date() && branch.semester.end <= new Date(),
    );
    const expectedBody = {
      id: userFromDb.id,
      firstName: userFromDb.firstName,
      lastName: userFromDb.lastName,
      nickname: userFromDb.infos.nickname,
      type: userFromDb.userType,
      avatar: userFromDb.infos.avatar,
      sex: userFromDb.privacy.sex ? userFromDb.infos.sex : undefined,
      nationality: userFromDb.infos.nationality,
      birthday: userFromDb.privacy.birthday ? userFromDb.infos.birthday : undefined,
      passions: userFromDb.infos.passions,
      website: userFromDb.infos.website,
      branch: branch?.branchOption.branch.code ?? undefined,
      semester: branch?.semesterNumber ?? undefined,
      branchOption: branch?.branchOption.code ?? undefined,
      mailUTT: userFromDb.mailsPhones === null ? undefined : userFromDb.mailsPhones.mailUTT,
      mailPersonal:
        userFromDb.privacy.mailPersonal && !(userFromDb.mailsPhones === null)
          ? userFromDb.mailsPhones.mailPersonal
          : undefined,
      phone:
        userFromDb.privacy.phoneNumber && !(userFromDb.mailsPhones === null)
          ? userFromDb.mailsPhones.phoneNumber
          : undefined,
      addresses:
        userFromDb.privacy.address === 'ALL_PUBLIC'
          ? userFromDb.addresses.map((address) => ({
              street: address.street,
              postalCode: address.postalCode,
              city: address.city,
              country: address.country,
            }))
          : [],
      facebook: userFromDb.socialNetwork === null ? undefined : userFromDb.socialNetwork.facebook,
      twitter: userFromDb.socialNetwork === null ? undefined : userFromDb.socialNetwork.twitter,
      instagram: userFromDb.socialNetwork === null ? undefined : userFromDb.socialNetwork.instagram,
      linkedin: userFromDb.socialNetwork === null ? undefined : userFromDb.socialNetwork.linkedin,
      twitch: userFromDb.socialNetwork === null ? undefined : userFromDb.socialNetwork.twitch,
      spotify: userFromDb.socialNetwork === null ? undefined : userFromDb.socialNetwork.spotify,
      discord:
        userFromDb.privacy.discord && !(userFromDb.socialNetwork === null)
          ? userFromDb.socialNetwork.discord
          : undefined,
    };

    return pactum
      .spec()
      .get(`/users/${userFromDb.id}`)
      .withBearerToken(user.token)
      .expectStatus(HttpStatus.OK)
      .expectJsonMatchStrict(
        Object.fromEntries(Object.entries(expectedBody).filter(([, value]) => value !== undefined)),
      );
  });
});

export default GetUserE2ESpec;
