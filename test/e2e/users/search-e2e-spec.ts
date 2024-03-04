import { AuthSignUpDto } from '../../../src/auth/dto';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { AuthService } from '../../../src/auth/auth.service';
import * as pactum from 'pactum';
import { suite } from '../../test_utils';
import { User } from '../../../src/prisma/types';

const includeInfos = { include: { infos: true } };

function userToBodyUser(user: User) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    nickname: user.infos.nickname,
  };
}

const SearchE2ESpec = suite('GET /users', (app) => {
  const userInfos = {
    login: 'users',
    password: 'verystrongpwd',
    sex: 'FEMALE',

    studentId: 69,
    lastName: 'profile',
    firstName: 'profile',
    birthday: new Date(Date.UTC(2000, 1, 1)),
  } as AuthSignUpDto;

  const otherUserInfos = {
    login: 'otheruser',
    password: 'thisisevenstronger',
    sex: 'MALE',
    studentId: 70,
    lastName: 'other',
    firstName: 'user',
    birthday: new Date(Date.UTC(1998, 12, 4)),
  } as AuthSignUpDto;

  let token: string;

  beforeAll(async () => {
    await app().get(PrismaService).cleanDb();
    token = (await app().get(AuthService).signup(userInfos)).access_token;
    await app().get(AuthService).signup(otherUserInfos);
    await app()
      .get(PrismaService)
      .user.update({
        where: { login: otherUserInfos.login },
        data: { infos: { update: { nickname: 'nickname' } } },
      });
  });

  it('should return a 401 because user is not authenticated', async () => {
    return pactum.spec().get('/users').expectStatus(401);
  });

  it('should return both users by searching by their firstName', async () => {
    const users = await app().get(PrismaService).user.findMany(includeInfos);
    return pactum
      .spec()
      .get('/users?firstName=e')
      .withBearerToken(token)
      .expectStatus(200)
      .expectBodyContains(userToBodyUser(users[0]))
      .expectBodyContains(userToBodyUser(users[1]));
  });

  it('should return a user by searching by their last name', async () => {
    const user = await app()
      .get(PrismaService)
      .user.findUnique({
        where: { login: userInfos.login },
        ...includeInfos,
      });
    return pactum
      .spec()
      .get(`/users?lastName=${userInfos.lastName}`)
      .withBearerToken(token)
      .expectStatus(200)
      .expectBody([userToBodyUser(user)]);
  });

  it('should return a user by searching by their nickname', async () => {
    const user = await app()
      .get(PrismaService)
      .user.findUnique({
        where: { login: otherUserInfos.login },
        ...includeInfos,
      });
    return pactum
      .spec()
      .get('/users?nickname=nickname')
      .withBearerToken(token)
      .expectStatus(200)
      .expectBody([userToBodyUser(user)]);
  });

  it('should return a user by searching with the name field (searching in the first name)', async () => {
    const users = await app()
      .get(PrismaService)
      .user.findUnique({
        where: { login: otherUserInfos.login },
        ...includeInfos,
      });
    return pactum
      .spec()
      .get(`/users?name=${otherUserInfos.firstName}`)
      .withBearerToken(token)
      .expectStatus(200)
      .expectBody([userToBodyUser(users)]);
  });

  it('should return a user by searching with the name field (searching in the last name)', async () => {
    const users = await app()
      .get(PrismaService)
      .user.findUnique({
        where: { login: otherUserInfos.login },
        ...includeInfos,
      });
    return pactum
      .spec()
      .get(`/users?name=${otherUserInfos.lastName}`)
      .withBearerToken(token)
      .expectStatus(200)
      .expectBody([userToBodyUser(users)]);
  });
});

export default SearchE2ESpec;
