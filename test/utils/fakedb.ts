import { RawTimetableEntry, RawTimetableEntryOverride, RawTimetableGroup, RawUser } from '../../src/prisma/types';
import { faker } from '@faker-js/faker';
import { AuthSignUpDto } from '../../src/auth/dto';
import { AuthService } from '../../src/auth/auth.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AppProvider } from './test_utils';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaTypes } from './prisma.types';

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

/*export function createTimetableEntryOverride2(app: AppProvider, data) {
  return create2(app, 'timetableEntryOverride', { applyFrom: 0, applyUntil: 0 }, data);
}*/
/*
export function create<
  T2 extends TypeMap<PrismaClient
  Table extends { create: (arg: { data: Data & Connections }) => Promise<ReturnType> },
  Data,
  Connections extends Array<{fieldName: string, id: string /!*; [key: string]: any*!/ }>,
  ReturnType,
>(app: AppProvider, table: Table, default_: Data, data: Partial<Data> = {}, connections: Connections): Partial<ReturnType> {
  const row: Partial<ReturnType> = {};
  beforeAll(async () => {
    const createdRow = await app().get(PrismaService)[table].create({ data: { ...default_, ...data, ...connections.map((c) => ({[fieldName]: {connect: }})) } });
    Object.assign(row, createdRow);
  });
  return row;
}*/

/*type AllData<Table extends Prisma.TypeMap['meta']['modelProps']> = Parameters<
  PrismaClient[Table]['create']
>[0] extends Prisma.SelectSubset<{ data: infer D }, any>
  ? D
  : never;
type NormalData<Table extends Prisma.TypeMap['meta']['modelProps']> = AllData<Table> extends Prisma.XOR<
  infer A,
  infer B
>
  ? Pick<A, keyof B & keyof A>
  : never;
type Connections<Table extends Prisma.TypeMap['meta']['modelProps']> = AllData<Table> extends Prisma.XOR<
  infer A,
  infer B
>
  ? Omit<B, keyof A>
  : never;*/
type Fake<Table extends Prisma.TypeMap['meta']['modelProps']> = ReturnType<PrismaClient[Table]['create']>;

// type E<T> = {[]}
// type A = Parameters<PrismaClient<infer T>["timetableEntry"]['create']>[0] extends Prisma.SelectSubset<any, infer R<T>> ? true: false;
// type B = Connections<"timetableEntry">;
// type C = Prisma.XOR<Prisma.TimetableEntryCreateInput, Prisma.TimetableEntryUncheckedCreateInput> extends Prisma.XOR<infer A, infer B> ? keyof B : never;
// type D = keyof AllData<"timetableEntry">;

type T = Prisma.TypeMap['meta']['modelProps'];

//type A = '' extends keyof PrismaTypes ? true : false;
// type a = keyof typeof Prisma & `Timetable${string}`;
type EEEE<Table extends Prisma.TypeMap['meta']['modelProps']> = Table extends keyof PrismaTypes
  ? PrismaTypes[Table]
  : never;
type rel<Table extends Prisma.TypeMap['meta']['modelProps']> = {
  [K in keyof EEEE<Table> as Required<EEEE<Table>[K]> extends { create: object } ? K : never]: EEEE<Table>[K];
};
//type E = keyof rel<'timetableEntry'>;
type nonRel<Table extends Prisma.TypeMap['meta']['modelProps']> = {
  [K in Exclude<keyof EEEE<Table>, keyof rel<Table>>]: EEEE<Table>[K];
};
//type E2 = keyof nonRel<'timetableEntry'>;

type E2 = rel<'timetableEntryOverride'>;
type relArgs<Table extends T> = {
  [K in keyof rel<Table>]: rel<Table>[K] /*extends { connect: any } ? true : false*/;
};
type E3 = relArgs<'timetableEntryOverride'>;

//const a: E3;

// type ajkj = rel<"timetableEntry">;
//
// type nonRel<Table extends Prisma.TypeMap['meta']['modelProps']> = {[ K in Exclude<keyof AllData<Table>, keyof rel<Table>>]: AllData<Table>[K]};
// type hgjgj = nonRel<"timetableEntry">;

export function create2<Table extends Prisma.TypeMap['meta']['modelProps']>(
  app: AppProvider,
  table: Table,
  default_: nonRel<Table>,
  data: Partial<nonRel<Table>> = {},
  connections: rel<Table>,
): Partial<Fake<Table>> {
  const row: Partial<Fake<Table>> = {};
  beforeAll(async () => {
    const createdRow = await (
      app().get(PrismaService)[table].create as unknown as (arg: object) => Partial<Fake<Table>>
    )({ data: { ...default_, ...data, ...connections } });
    Object.assign(row, createdRow);
  });
  return row;
}
