import { PrismaService } from '../src/prisma/prisma.service';
import { INestApplication } from '@nestjs/common';
import { AuthService } from '../src/auth/auth.service';
import { AuthSignInDto, AuthSignUpDto } from '../src/auth/dto';

export function suite(
  name: string,
  func: (app: () => INestApplication) => void,
) {
  return (app: () => INestApplication) =>
    describe(name, () => {
      beforeAll(async () => {
        await app().get(PrismaService).cleanDb();
      });
      func(app);
    });
}

export function createUser(
  app: () => INestApplication,
  { login = 'user', studentId = 2 } = {},
) {
  const user = {
    login,
    studentId,
    sex: 'OTHER',
    lastName: 'user',
    firstName: 'user',
    birthday: new Date(Date.now()),
    password: 'password',
  } as AuthSignUpDto;
  const userWithToken = { ...user, token: '' };
  beforeAll(async () => {
    userWithToken.token = (
      await app().get(AuthService).signup(user)
    ).access_token;
  });
  return userWithToken;
}
