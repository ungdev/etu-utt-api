import { PrismaService } from '../src/prisma/prisma.service';
import { INestApplication } from '@nestjs/common';
import { AuthService } from '../src/auth/auth.service';
import { AuthSignUpDto } from '../src/auth/dto';
import { TestingModule } from '@nestjs/testing';
import { RawUser } from '../src/prisma/types';

export type E2EAppProvider = () => INestApplication;

export function e2eSuite(name: string, func: (app: E2EAppProvider) => void) {
  return (app: E2EAppProvider) =>
    describe(name, () => {
      beforeAll(async () => {
        await app().get(PrismaService).cleanDb();
      });
      func(app);
    });
}

export type UnitAppProvider = () => TestingModule;

export function unitSuite(name: string, func: (app: UnitAppProvider) => void) {
  return (app: UnitAppProvider) =>
    describe(name, () => {
      beforeAll(async () => {
        await app().get(PrismaService).cleanDb();
      });
      func(app);
    });
}

export type UserWithToken = Partial<RawUser & { token: string }>;

export function createUser(
  app: () => INestApplication,
  { login = 'user', studentId = 2 } = {},
): Partial<RawUser & { token: string }> {
  const userData = {
    login,
    studentId,
    sex: 'OTHER',
    lastName: 'user',
    firstName: 'user',
    birthday: new Date(Date.now()),
    password: 'password',
  } as AuthSignUpDto;
  const userWithToken: Partial<RawUser & { token: string }> = {};
  beforeAll(async () => {
    userWithToken.token = await app().get(AuthService).signup(userData);
    const user = await app().get(PrismaService).user.findUnique({ where: { login } });
    for (const [key, value] of Object.entries(user)) {
      userWithToken[key] = value;
    }
  });
  return userWithToken;
}
