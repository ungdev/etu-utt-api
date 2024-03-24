import * as pactum from 'pactum';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { e2eSuite } from '../../utils/test_utils';
import { AuthSignUpDto } from '../../../src/auth/dto';
import { AuthService } from '../../../src/auth/auth.service';
import { ERROR_CODE } from '../../../src/exceptions';

const UpdateE2ESpec = e2eSuite('Update', (app) => {
  const userInfos = {
    login: 'profile',
    password: 'verystrongpwd',
    sex: 'FEMALE',
    studentId: 69,
    lastName: 'profile',
    firstName: 'profile',
    type: 'STUDENT',
    birthday: new Date(Date.UTC(2000, 1, 1)), // We need to do it this way because of timezones
  } as AuthSignUpDto;
  let token: string;
  let id: string;

  beforeAll(async () => {
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
      .expectAppError(ERROR_CODE.NOT_LOGGED_IN);
  });

  it('should return a 400 if no body is sent', async () => {
    return pactum.spec().post('/profile').withBearerToken(token).expectAppError(ERROR_CODE.NO_FIELD_PROVIDED);
  });

  it('should return a 400 if the body is empty', async () => {
    return pactum
      .spec()
      .post('/profile')
      .withBearerToken(token)
      .withBody({})
      .expectAppError(ERROR_CODE.NO_FIELD_PROVIDED);
  });

  it('should return a 400 if "nickname" is not a string', async () => {
    return pactum
      .spec()
      .post('/profile')
      .withBearerToken(token)
      .withBody({ nickname: 42 }) // 42 is the answer to everything <- these 2 things have been generated with copilot, that's amazing :)
      .expectAppError(ERROR_CODE.PARAM_NOT_STRING, 'nickname');
  });

  it('should return a 400 if "passions" is not a string', async () => {
    return pactum
      .spec()
      .post('/profile')
      .withBearerToken(token)
      .withBody({ passions: 42 })
      .expectAppError(ERROR_CODE.PARAM_NOT_STRING, 'passions');
  });

  it('should return a 400 if "website" is not a string', async () => {
    return pactum
      .spec()
      .post('/profile')
      .withBearerToken(token)
      .withBody({ website: 42 })
      .expectAppError(ERROR_CODE.PARAM_NOT_STRING, 'website');
  });

  it('should return a 400 if there is an unknown field', async () => {
    return pactum
      .spec()
      .post('/profile')
      .withBearerToken(token)
      .withBody({ youdontknowme: 'secretmeaning' })
      .expectAppError(ERROR_CODE.PARAM_DOES_NOT_EXIST, 'youdontknowme');
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
