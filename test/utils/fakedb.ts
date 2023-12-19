import { RawTimetableEntry, RawTimetableEntryOverride, RawTimetableGroup, RawUser } from '../../src/prisma/types';
import { faker } from '@faker-js/faker';
import { AuthSignUpDto } from '../../src/auth/dto';
import { AuthService } from '../../src/auth/auth.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AppProvider } from './test_utils';
import { Prisma } from '@prisma/client';

export type FakeUser = Partial<RawUser & { token: string }>;
export type FakeTimetableGroup = Partial<RawTimetableGroup>;
export type FakeTimetableEntry = Partial<RawTimetableEntry>;
export type FakeTimetableEntryOverride = Partial<RawTimetableEntryOverride>;

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

export function createTimetableEntry(
  app: AppProvider,
  startsIn: number,
  occurrenceDuration: number,
  group: FakeTimetableGroup,
): FakeTimetableEntry {
  const entry: FakeTimetableEntry = {};
  beforeAll(async () => {
    const createdEntry = await app()
      .get(PrismaService)
      .timetableEntry.create({
        data: {
          eventStart: new Date(Date.now() + startsIn),
          occurrenceDuration,
          type: 'CUSTOM',
          location: faker.address.cityName(),
          timetableGroup: { connect: { id: group.id } },
        },
      });
    for (const [key, value] of Object.entries(createdEntry)) {
      entry[key] = value;
    }
  });
  return entry;
}

export function createTimetableEntryOverride(
  app: AppProvider,
  timetableEntry: FakeTimetableEntry,
  group: FakeTimetableGroup,
  data: Partial<Omit<Prisma.TimetableEntryOverrideCreateInput, 'overrideTimetableEntry' | 'timetableGroup'>> = {},
): FakeTimetableEntryOverride {
  const override: FakeTimetableEntryOverride = {};
  beforeAll(async () => {
    const createdOverride = await app()
      .get(PrismaService)
      .timetableEntryOverride.create({
        data: {
          applyFrom: 0,
          applyUntil: 0,
          overrideTimetableEntry: { connect: { id: timetableEntry.id } },
          timetableGroup: { connect: { id: group.id } },
          ...data,
        },
      });
    for (const [key, value] of Object.entries(createdOverride)) {
      override[key] = value;
    }
  });
  return override;
}
