import * as pactum from 'pactum';
import { AuthService } from '../../src/auth/auth.service';
import { INestApplication } from '@nestjs/common';
import { AuthSignUpDto } from '../../src/auth/dto';
import { PrismaService } from '../../src/prisma/prisma.service';

export function ProfileE2ESpec(app: () => INestApplication) {
  const userInfos = {
    login: 'profile',
    password: 'verystringpwd',
    sex: 'FEMALE',
    studentId: 69,
    lastName: 'profile',
    firstName: 'profile',
    birthday: new Date(Date.UTC(2000, 1, 1)), // We need to do it this way because of timezones
  } as AuthSignUpDto;
  let token: string;
  let id: string;

  beforeAll(async () => {
    token = (await app().get(AuthService).signup(userInfos)).access_token;
    id = (
      await app()
        .get(PrismaService)
        .user.findUnique({ where: { login: userInfos.login } })
    ).id;
  });

  describe('Profile', () => {
    describe('Get', () => {
      it('should return a 401 if we are not logged in', async () => {
        return pactum.spec().get('/profile').expectStatus(401);
      });
      it('should return the user if we are logged in', async () => {
        const expectedBody = {
          login: 'profile',
          sex: 'FEMALE',
          studentId: 69,
          lastName: 'profile',
          firstName: 'profile',
          birthday: userInfos.birthday.toISOString(),
          id,
          nickname: null,
          passions: null,
          website: null,
        };
        return pactum
          .spec()
          .get('/profile')
          .withBearerToken(token)
          .expectStatus(200)
          .expectBody(expectedBody);
      });
    });

    describe('Update', () => {
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
  });
}
