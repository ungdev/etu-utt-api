import * as pactum from 'pactum';
import { PrismaService } from '@/prisma/prisma.service';
import { suite } from '../../test_utils';
import { AuthSignUpDto } from '@/auth/dto';
import { AuthService } from '@/auth/auth.service';

const UpdateE2ESpec = suite('Update', (app) => {
  const userInfos = {
    login: 'profile',
    password: 'verystrongpwd',
    sex: 'FEMALE',
    studentId: 69,
    lastName: 'profile',
    firstName: 'profile',
    birthday: new Date(Date.UTC(2000, 1, 1)), // We need to do it this way because of timezones
  } as AuthSignUpDto;
  let token: string;
  let id: string;

  beforeAll(async () => {
    await app().get(PrismaService).cleanDb();
    token = await app().get(AuthService).signup(userInfos);
    id = (
      await app()
        .get(PrismaService)
        .user.findUnique({ where: { login: userInfos.login } })
    ).id;
  });

  it('should return a 401 if we are not logged in', async () => {
    return pactum
      .spec()
      .post('/profile')
      .withBody({ website: 'https://etu.utt.fr' })
      .expectStatus(401);
  });

  it('should return a 400 if no body is sent', async () => {
    return pactum
      .spec()
      .post('/profile')
      .withBearerToken(token)
      .expectStatus(400);
  });

  it('should return a 400 if the body is empty', async () => {
    return pactum
      .spec()
      .post('/profile')
      .withBearerToken(token)
      .withBody({})
      .expectStatus(400);
  });

  it('should return a 400 if "nickname" is not a string', async () => {
    return pactum
      .spec()
      .post('/profile')
      .withBearerToken(token)
      .withBody({ nickname: 42 }) // 42 is the answer to everything <- these 2 things have been generated with copilot, that's amazing :)
      .expectStatus(400);
  });

  it('should return a 400 if "passions" is not a string', async () => {
    return pactum
      .spec()
      .post('/profile')
      .withBearerToken(token)
      .withBody({ passions: 42 })
      .expectStatus(400);
  });

  it('should return a 400 if "website" is not a string', async () => {
    return pactum
      .spec()
      .post('/profile')
      .withBearerToken(token)
      .withBody({ website: 42 })
      .expectStatus(400);
  });

  it('should return a 400 if there is an unknown field', async () => {
    return pactum
      .spec()
      .post('/profile')
      .withBearerToken(token)
      .withBody({ youdontknowme: 'secretmeaning' })
      .expectStatus(400);
  });

  it('should return a 200 if everything was specified', async () => {
    await pactum
      .spec()
      .post('/profile')
      .withBearerToken(token)
      .withBody({
        website: 'https://ent.utt.fr',
        nickname: 'EtuUTT',
        passions: "testing, that's fun, i swear",
      })
      .expectStatus(201);
    const user = await app()
      .get(PrismaService)
      .user.findUnique({ where: { id }, include: { infos: true } });
    expect(user.infos.website).toBe('https://ent.utt.fr');
    expect(user.infos.nickname).toBe('EtuUTT');
    expect(user.infos.passions).toBe("testing, that's fun, i swear");
  });

  it('should return a 200 if at least one field is specified, and should not modify the fields that are not specified', async () => {
    await pactum
      .spec()
      .post('/profile')
      .withBearerToken(token)
      .withBody({ website: 'https://etu.utt.fr' })
      .expectStatus(201);
    const user = await app()
      .get(PrismaService)
      .user.findUnique({ where: { id }, include: { infos: true } });
    expect(user.infos.website).toBe('https://etu.utt.fr');
    expect(user.infos.nickname).toBe('EtuUTT');
    expect(user.infos.passions).toBe("testing, that's fun, i swear");
  });
});

export default UpdateE2ESpec;
