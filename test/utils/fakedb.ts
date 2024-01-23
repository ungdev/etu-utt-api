import {
  RawTimetableEntry,
  RawTimetableEntryOverride,
  RawTimetableGroup,
  RawUser,
  RawUserInfos,
} from '../../src/prisma/types';
import { faker } from '@faker-js/faker';
import { AuthService } from '../../src/auth/auth.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AppProvider } from './test_utils';
import { Sex, TimetableEntryType, UserRole } from '@prisma/client';
import { User } from '../../src/users/interfaces/user.interface';
import { SelectUEOverview, UEOverView } from '../../src/ue/interfaces/ue-overview.interface';
import { SelectUEDetail, UEDetail } from '../../src/ue/interfaces/ue-detail.interface';
import { Criterion, SelectCriterion } from '../../src/ue/interfaces/criterion.interface';
import { UEComment } from '../../src/ue/interfaces/comment.interface';
import { UEService } from '../../src/ue/ue.service';
import { UECommentReply } from '../../src/ue/interfaces/comment-reply.interface';
import { omit, pick } from '../../src/utils';

/**
 * The fake entities can be used like normal entities in the <code>it(string, () => void)</code> functions.
 * They are what is returned by the functions in this file.
 */
export type FakeUser = Partial<RawUser & RawUserInfos & { token: string }>;
export type FakeTimetableGroup = Partial<RawTimetableGroup>;
export type FakeTimetableEntry = Partial<RawTimetableEntry>;
export type FakeTimetableEntryOverride = Partial<RawTimetableEntryOverride>;

/**
 * Creates a user in the database.
 * @param app The function that returns the app.
 * @param rawParams The parameters to use to create the user.
 * @returns {@link FakeUser}
 */
export function createUser(app: AppProvider, rawParams: FakeUser & { password?: string } = {}): FakeUser {
  const params = {
    login: faker.internet.userName(),
    studentId: faker.datatype.number(),
    sex: 'OTHER' as Sex,
    lastName: faker.name.lastName(),
    firstName: faker.name.firstName(),
    role: 'STUDENT' as UserRole,
    birthday: new Date(0),
    password: faker.internet.password(),
    ...rawParams,
  };
  const userWithToken: Partial<User & { token: string }> = {};
  beforeAll(async () => {
    const user = await app()
      .get(PrismaService)
      .user.create({
        data: {
          hash: rawParams.hash ?? (await app().get(AuthService).getHash(params.password)),
          ...pick(params, 'id', 'login', 'hash', 'studentId', 'firstName', 'lastName', 'role'),
          infos: { create: pick(params, 'birthday', 'sex', 'nickname') },
        },
        include: {
          infos: true,
          permissions: {
            select: {
              userPermissionId: true,
            },
          },
        },
      });
    const permissions = user.permissions.map((perm) => perm.userPermissionId);
    Object.assign(userWithToken, { ...omit(user, 'infos', 'permissions'), ...omit(user.infos, 'id') });
    userWithToken.token = await app().get(AuthService).signToken(user.id, user.login);
    userWithToken.permissions = permissions;
  });
  return userWithToken;
}

export type CreateTimetableGroupParams = { users?: Array<{ user: FakeUser; priority: number }> };
export function createTimetableGroup(
  app: AppProvider,
  params: CreateTimetableGroupParams,
  onTheFly?: false,
): FakeTimetableGroup;
export function createTimetableGroup(
  app: AppProvider,
  params: CreateTimetableGroupParams,
  onTheFly?: true,
): Promise<FakeTimetableGroup>;
/**
 * Creates a timetableGroup in the database.
 * @param app The function that returns the app.
 * @param rawParams The parameters to use to create the group.
 * @param onTheFly If false, the creation will be done in a beforeAll block.
 * @returns {@link FakeTimetableGroup}
 */
export function createTimetableGroup(
  app: AppProvider,
  rawParams: CreateTimetableGroupParams,
  onTheFly = false,
): FakeTimetableGroup | Promise<FakeTimetableGroup> {
  const params = {
    users: [],
    ...rawParams,
  };
  const timetableGroup: FakeTimetableGroup = {};
  const createTimetableGroup = async () => {
    const createdGroup = await app()
      .get(PrismaService)
      .timetableGroup.create({
        data: {
          name: faker.random.words(),
          userTimetableGroups: {
            createMany: {
              data: params.users.map((user) => ({ userId: user.user.id, priority: user.priority })),
            },
          },
        },
      });
    Object.assign(timetableGroup, createdGroup);
  };
  const promise = onTheFly ? createTimetableGroup() : (beforeAll(createTimetableGroup) as void);
  return onTheFly ? (promise as Promise<void>).then(() => timetableGroup) : timetableGroup;
}

export type CreateTimetableEntryParameters = FakeTimetableEntry & { groups?: FakeTimetableGroup[] };
export function createTimetableEntry(
  app: AppProvider,
  params?: CreateTimetableEntryParameters,
  onTheFly?: false,
): FakeTimetableEntry;
export function createTimetableEntry(
  app: AppProvider,
  params?: CreateTimetableEntryParameters,
  onTheFly?: true,
): Promise<FakeTimetableEntry>;
/**
 * Creates a timetableEntry in the database.
 * @param app The function that returns the app.
 * @param rawParams The parameters to use to create the entry.
 * @param onTheFly If false, the creation will be done in a beforeAll block.
 * @returns {@link FakeTimetableEntry}
 */
export function createTimetableEntry(
  app: AppProvider,
  rawParams: CreateTimetableEntryParameters = {},
  onTheFly = false,
): Promise<FakeTimetableEntry> | FakeTimetableEntry {
  const params = {
    eventStart: new Date(0),
    occurrenceDuration: 0,
    occurrencesCount: 1,
    repeatEvery: 0,
    type: 'CUSTOM' as TimetableEntryType,
    location: faker.address.cityName(),
    groups: [],
    ...rawParams,
  };
  const entry: FakeTimetableEntry = {};
  const createTimetableEntry = async () => {
    const createdEntry = await app()
      .get(PrismaService)
      .timetableEntry.create({
        data: {
          timetableGroups: { connect: params.groups.map((group) => ({ id: group.id })) },
          ...omit(params, 'groups', 'eventId', 'ueCourseId'),
        },
      });
    Object.assign(entry, createdEntry);
  };
  const promise = onTheFly ? createTimetableEntry() : (beforeAll(createTimetableEntry) as void);
  return onTheFly ? (promise as Promise<void>).then(() => entry) : entry;
}

export type CreateTimetableEntryOverrideParameters = {
  groups?: FakeTimetableGroup[];
} & Partial<FakeTimetableEntryOverride>;
export function createTimetableEntryOverride(
  app: AppProvider,
  timetableEntry: FakeTimetableEntry,
  params: CreateTimetableEntryOverrideParameters,
  onTheFly?: false,
): FakeTimetableEntryOverride;
export function createTimetableEntryOverride(
  app: AppProvider,
  timetableEntry: FakeTimetableEntry,
  params: CreateTimetableEntryOverrideParameters,
  onTheFly?: true,
): Promise<FakeTimetableEntryOverride>;
/**
 * Creates a timetableEntryOverride in the database.
 * @param app The function that returns the app.
 * @param timetableEntry The timetableEntry to override.
 * @param rawParams The parameters to use to create the override.
 * @param onTheFly If false, the creation will be done in a beforeAll block.
 */
export function createTimetableEntryOverride(
  app: AppProvider,
  timetableEntry: FakeTimetableEntry,
  rawParams: CreateTimetableEntryOverrideParameters = {},
  onTheFly = false,
): FakeTimetableEntryOverride | Promise<FakeTimetableEntryOverride> {
  const params = {
    groups: [],
    applyFrom: 0,
    applyUntil: 0,
    ...rawParams,
  };
  const override: FakeTimetableEntryOverride = {};
  const createTimetableEntryOverride = async () => {
    const createdOverride = await app()
      .get(PrismaService)
      .timetableEntryOverride.create({
        data: {
          overrideTimetableEntry: { connect: { id: timetableEntry.id } },
          timetableGroups: { connect: params.groups.map((group) => ({ id: group.id })) },
          ...omit(params, 'groups', 'overrideTimetableEntryId'),
        },
      });
    Object.assign(override, createdOverride);
  };
  const promise = onTheFly ? createTimetableEntryOverride() : (beforeAll(createTimetableEntryOverride) as void);
  return onTheFly ? (promise as Promise<void>).then(() => override) : override;
}

type UECreationOptions<T extends boolean> = {
  code?: string;
  category?: string;
  filiere?: string;
  branch?: string;
  semester?: string;
  forOverview?: T;
};
export function createUE<T extends boolean = false>(
  app: AppProvider,
  opt?: UECreationOptions<T>,
): Partial<T extends true ? UEOverView : UEDetail>;
export function createUE(
  app: AppProvider,
  { code = 'XX00', category = 'CS', filiere = 'JSP', branch = 'JSP_BR', semester = 'A24', forOverview = false } = {},
) {
  const partialUE: Partial<UEOverView | UEDetail> = {};
  const data = {
    data: {
      code,
      inscriptionCode: code,
      name: `UE ${code}`,
      credits: {
        create: [
          {
            category: {
              connectOrCreate: {
                create: { code: category, name: category },
                where: { code: category },
              },
            },
            credits: 6,
          },
        ],
      },
      filiere: {
        connectOrCreate: {
          create: {
            code: filiere,
            name: filiere,
            branche: {
              connectOrCreate: {
                create: {
                  code: branch,
                  name: branch,
                  descriptionTranslation: {
                    create: {},
                  },
                },
                where: {
                  code: branch,
                },
              },
            },
            descriptionTranslation: {
              create: {},
            },
          },
          where: {
            code: filiere,
          },
        },
      },
      info: {
        create: {
          programme: 'What is going to be studied',
          objectives: 'The objectives of the UE',
        },
      },
      workTime: {
        create: {
          cm: 20,
          td: 20,
          tp: 16,
          the: 102,
          projet: 48,
        },
      },
      openSemester: {
        connectOrCreate: {
          create: {
            code: semester,
            start: new Date(),
            end: new Date(),
          },
          where: {
            code: semester,
          },
        },
      },
    },
  };
  beforeAll(async () => {
    const ue = await (forOverview
      ? app().get(PrismaService).uE.create(SelectUEOverview(data))
      : app().get(PrismaService).uE.create(SelectUEDetail(data)));
    Object.assign(
      partialUE,
      !('workTime' in ue)
        ? {
            ...ue,
            openSemester: ue.openSemester.map((semester) => ({
              ...semester,
              start: (<Date>semester.start).toISOString(),
              end: (<Date>semester.end).toISOString(),
            })),
          }
        : {
            ...ue,
            openSemester: ue.openSemester.map((semester) => semester.code),
            starVotes: {},
          },
    );
  });
  return partialUE;
}

export function makeUserJoinUE(app: AppProvider, user: Partial<User>, ue: Partial<UEOverView | UEDetail>) {
  beforeAll(() =>
    app()
      .get(PrismaService)
      .userUESubscription.create({
        data: {
          UE: {
            connect: {
              code: ue.code,
            },
          },
          user: {
            connect: {
              id: user.id,
            },
          },
          semester: {
            connectOrCreate: {
              create: {
                code: 'A24',
                end: new Date(),
                start: new Date(),
              },
              where: {
                code: 'A24',
              },
            },
          },
        },
      }),
  );
}

export function createUERating(
  app: AppProvider,
  user: Partial<User>,
  criterion: Partial<Criterion>,
  ue: Partial<UEDetail | UEOverView>,
  value = 3,
) {
  beforeAll(async () => {
    return app()
      .get(PrismaService)
      .uEStarVote.create({
        data: {
          criterion: {
            connect: {
              id: criterion.id,
            },
          },
          user: {
            connect: {
              id: user.id,
            },
          },
          UE: {
            connect: {
              code: ue.code,
            },
          },
          value,
        },
      });
  });
}

export function createCriterion(app: AppProvider, name = 'testCriterion') {
  const lazyCriterion: Partial<Criterion> = {};
  beforeAll(async () => {
    Object.assign(
      lazyCriterion,
      await app()
        .get(PrismaService)
        .uEStarCriterion.create(
          SelectCriterion({
            data: {
              name,
              descriptionTranslation: {
                create: {},
              },
            },
          }),
        ),
    );
  });
  return lazyCriterion;
}

export function createComment(
  app: AppProvider,
  onUE: Partial<UEOverView | UEDetail>,
  user: FakeUser,
  anonymous = false,
) {
  const lazyComment: Partial<UEComment> = {};
  beforeAll(async () => {
    const sub = await app()
      .get(PrismaService)
      .userUESubscription.findFirst({
        where: {
          UE: {
            code: onUE.code,
          },
          userId: user.id,
        },
      });
    if (!sub)
      await app()
        .get(PrismaService)
        .userUESubscription.create({
          data: {
            semester: {
              connectOrCreate: {
                create: {
                  code: 'A24',
                  start: new Date(),
                  end: new Date(),
                },
                where: { code: 'A24' },
              },
            },
            UE: { connect: { code: onUE.code } },
            user: { connect: { id: user.id } },
          },
        });
    Object.assign(
      lazyComment,
      await app().get(UEService).createComment(
        {
          body: 'TEST',
          isAnonymous: anonymous,
        },
        user.id,
        onUE.code,
      ),
    );
  });
  return lazyComment;
}

export function upvoteComment(app: AppProvider, user: Partial<User>, comment: Partial<UEComment>) {
  beforeAll(() => {
    comment.upvotes++;
    return app()
      .get(PrismaService)
      .uECommentUpvote.create({
        data: {
          comment: {
            connect: {
              id: comment.id,
            },
          },
          user: {
            connect: {
              id: user.id,
            },
          },
        },
      });
  });
}

export function createReply(app: AppProvider, user: Partial<User>, comment: Partial<UEComment>) {
  const lazyReply: Partial<UECommentReply> = {};
  beforeAll(async () => {
    Object.assign(
      lazyReply,
      await app()
        .get(UEService)
        .replyComment(user as User, comment.id, {
          body: "Bouboubou je suis pas d'accord",
        }),
    );
  });
  return lazyReply;
}
