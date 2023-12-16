import { PrismaService } from '../src/prisma/prisma.service';
import { INestApplication } from '@nestjs/common';
import { AuthService } from '../src/auth/auth.service';
import { AuthSignUpDto } from '../src/auth/dto';
import { TestingModule } from '@nestjs/testing';

export function e2eSuite(name: string, func: (app: () => INestApplication) => void) {
  return (app: () => INestApplication) =>
    describe(name, () => {
      beforeAll(async () => {
        await app().get(PrismaService).cleanDb();
      });
      func(app);
    });
}

export function unitSuite(name: string, func: (app: () => TestingModule) => void) {
  return (app: () => TestingModule) =>
    describe(name, () => {
      beforeAll(async () => {
        await app().get(PrismaService).cleanDb();
      });
      func(app);
    });
}

export function createUser(app: () => INestApplication, { login = 'user', studentId = 2 } = {}) {
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
    userWithToken.token = await app().get(AuthService).signup(user);
  });
  return userWithToken;
}
