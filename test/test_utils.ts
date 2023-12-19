import { PrismaService } from '../src/prisma/prisma.service';
import { INestApplication } from '@nestjs/common';
import { AuthService } from '../src/auth/auth.service';
import { AuthSignUpDto } from '../src/auth/dto';
import { TestingModule } from '@nestjs/testing';
import { RawTimetableGroup, RawUser } from '../src/prisma/types';
import { faker } from '@faker-js/faker';

faker.seed(69);

export type E2EAppProvider = () => INestApplication;
export type UnitAppProvider = () => TestingModule;
export type AppProvider = E2EAppProvider | UnitAppProvider;

export function e2eSuite(name: string, func: (app: E2EAppProvider) => void) {
  return (app: E2EAppProvider) =>
    describe(name, () => {
      beforeAll(async () => {
        await app().get(PrismaService).cleanDb();
      });
      func(app);
    });
}

export function unitSuite(name: string, func: (app: UnitAppProvider) => void) {
  return (app: UnitAppProvider) =>
    describe(name, () => {
      beforeAll(async () => {
        await app().get(PrismaService).cleanDb();
      });
      func(app);
    });
}

export type FakeUser = Partial<RawUser & { token: string }>;
export type FakeTimetableGroup = Partial<RawTimetableGroup>;

export function createUser(app: AppProvider): FakeUser {
  const login = faker.internet.userName();
  const userData = {
    login,
    studentId: faker.datatype.number(),
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

export function createTimetableGroup(
  app: AppProvider,
  ...users: Array<{ user: FakeUser; priority: number }>
): FakeTimetableGroup {
  const timetableGroup: FakeTimetableGroup = {};
  beforeAll(async () => {
    console.log(users);
    const createdGroup = await app()
      .get(PrismaService)
      .timetableGroup.create({
        data: {
          name: faker.random.words(),
          userTimetableGroups: {
            createMany: {
              data: users.map((user) => ({ userId: user.user.id, priority: user.priority })),
            },
          },
        },
      });
    for (const [key, value] of Object.entries(createdGroup)) {
      timetableGroup[key] = value;
    }
  });
  return timetableGroup;
}
