import * as pactum from 'pactum';
import { e2eSuite } from '../../utils/test_utils';
import { AuthSignUpDto } from '../../../src/auth/dto';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { AuthService } from '../../../src/auth/auth.service';
import { ERROR_CODE } from '../../../src/exceptions';

const GetE2ESpec = e2eSuite('Get', (app) => {
  const userInfos = {
    login: 'profile',
    password: 'verystrongpwd',
    sex: 'FEMALE',
    studentId: 69,
    lastName: 'profile',
    firstName: 'profile',
    role: 'STUDENT',
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
    return pactum.spec().get('/profile').expectAppError(ERROR_CODE.NOT_LOGGED_IN);
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
    return pactum.spec().get('/profile').withBearerToken(token).expectStatus(200).expectBody(expectedBody);
  });
});

export default GetE2ESpec;
