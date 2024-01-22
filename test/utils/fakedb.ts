import { RawTimetableEntry, RawTimetableEntryOverride, RawTimetableGroup, RawUser } from '../../src/prisma/types';
import { faker } from '@faker-js/faker';
import { AuthSignUpDto } from '../../src/auth/dto';
import { AuthService } from '../../src/auth/auth.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AppProvider } from './test_utils';
import { Prisma } from '@prisma/client';
import { User } from '../../src/prisma/types';
import { SelectUEOverview, UEOverView } from '../../src/ue/interfaces/ue-overview.interface';
import { SelectUEDetail, UEDetail } from '../../src/ue/interfaces/ue-detail.interface';
import { Criterion, SelectCriterion } from '../../src/ue/interfaces/criterion.interface';
import { UEComment } from '../../src/ue/interfaces/comment.interface';
import { UEService } from '../../src/ue/ue.service';
import { UECommentReply } from '../../src/ue/interfaces/comment-reply.interface';

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
    role: 'STUDENT',
  } as AuthSignUpDto & User;
  const userWithToken: Partial<User & { token: string }> = {};
  beforeAll(async () => {
    userWithToken.token = await app().get(AuthService).signup(userData);
    const user = await app()
      .get(PrismaService)
      .user.findUnique({
        where: { login },
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
    delete user.permissions;
    Object.assign(userWithToken, user);
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
export function createTimetableGroup(
  app: AppProvider,
  { users = [] }: CreateTimetableGroupParams,
  onTheFly = false,
): FakeTimetableGroup | Promise<FakeTimetableGroup> {
  const timetableGroup: FakeTimetableGroup = {};
  const createTimetableGroup = async () => {
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
    Object.assign(timetableGroup, createdGroup);
  };
  const promise = onTheFly ? createTimetableGroup() : (beforeAll(createTimetableGroup) as void);
  return onTheFly ? (promise as Promise<void>).then(() => timetableGroup) : timetableGroup;
}

export type CreateTimetableEntryParameters = {
  startsAt?: Date;
  occurrenceDuration?: number;
  occurrencesCount?: number;
  repeatEvery?: number;
  groups?: FakeTimetableGroup[];
};
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
export function createTimetableEntry(
  app: AppProvider,
  {
    startsAt = new Date(0),
    occurrenceDuration = 0,
    occurrencesCount = 1,
    repeatEvery = 0,
    groups = [],
  }: CreateTimetableEntryParameters = {},
  onTheFly = false,
): Promise<FakeTimetableEntry> | FakeTimetableEntry {
  const entry: FakeTimetableEntry = {};
  const createTimetableEntry = async () => {
    const createdEntry = await app()
      .get(PrismaService)
      .timetableEntry.create({
        data: {
          eventStart: startsAt,
          occurrenceDuration,
          type: 'CUSTOM',
          location: faker.address.cityName(),
          occurrencesCount,
          repeatEvery,
          timetableGroups: { connect: groups.map((group) => ({ id: group.id })) },
        },
      });
    Object.assign(entry, createdEntry);
  };
  const promise = onTheFly ? createTimetableEntry() : (beforeAll(createTimetableEntry) as void);
  return onTheFly ? (promise as Promise<void>).then(() => entry) : entry;
}

export type CreateTimetableEntryOverrideParameters = {
  groups?: FakeTimetableGroup[];
} & Partial<Omit<Prisma.TimetableEntryOverrideCreateInput, 'overrideTimetableEntry' | 'timetableGroup'>>;
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
export function createTimetableEntryOverride(
  app: AppProvider,
  timetableEntry: FakeTimetableEntry,
  { groups = [], ...data }: CreateTimetableEntryOverrideParameters,
  onTheFly = false,
): FakeTimetableEntryOverride | Promise<FakeTimetableEntryOverride> {
  const override: FakeTimetableEntryOverride = {};
  const createTimetableEntryOverride = async () => {
    const createdOverride = await app()
      .get(PrismaService)
      .timetableEntryOverride.create({
        data: {
          applyFrom: 0,
          applyUntil: 0,
          overrideTimetableEntry: { connect: { id: timetableEntry.id } },
          timetableGroups: { connect: groups.map((group) => ({ id: group.id })) },
          ...data,
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
