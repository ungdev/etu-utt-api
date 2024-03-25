import {
  RawSemester,
  RawTimetableEntry,
  RawTimetableEntryOverride,
  RawTimetableGroup,
  RawUE,
  RawUEComment,
  RawUECommentReply,
  RawUECommentUpvote,
  RawUECredit,
  RawUECreditCategory,
  RawUEInfo,
  RawUEStarCriterion,
  RawUEStarVote,
  RawUEWorkTime,
  RawUTTBranch,
  RawUTTBranchOption,
  RawUser,
  RawUserInfos,
  RawUserUESubscription,
  RawAssoMembership,
  RawAsso,
  RawAssoMembershipRole,
} from '../../src/prisma/types';
import { faker } from '@faker-js/faker';
import { AuthService } from '../../src/auth/auth.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AppProvider } from './test_utils';
import { Sex, TimetableEntryType, UserType } from '@prisma/client';
import { omit, pick } from '../../src/utils';

/**
 * The fake entities can be used like normal entities in the <code>it(string, () => void)</code> functions.
 * They are what is returned by the functions in this file.
 */
export type FakeUser = Partial<RawUser & RawUserInfos & { permissions: string[]; token: string }>;
export type FakeTimetableGroup = Partial<RawTimetableGroup>;
export type FakeTimetableEntry = Partial<RawTimetableEntry>;
export type FakeTimetableEntryOverride = Partial<RawTimetableEntryOverride>;
export type FakeBranch = Partial<RawUTTBranch>;
export type FakeBranchOption = Partial<RawUTTBranchOption>;
export type FakeAssoMembership = Partial<RawAssoMembership> & {
  role?: Partial<RawAssoMembershipRole>;
};
export type FakeAsso = Partial<RawAsso>;
export type FakeSemester = Partial<RawSemester>;
export type FakeUE = Partial<RawUE> & {
  credits?: (Partial<RawUECredit> & { category: RawUECreditCategory })[];
  info?: Partial<RawUEInfo & { requirements: { code: string }[] }>;
  workTime?: Partial<RawUEWorkTime>;
  openSemesters?: Partial<RawSemester>[];
  branchOption?: Partial<RawUTTBranchOption & { branch: RawUTTBranch }>[];
};
export type FakeUserUESubscription = Partial<RawUserUESubscription>;
export type FakeUEStarCriterion = Partial<RawUEStarCriterion>;
export type FakeUEStarVote = Partial<RawUEStarVote>;
export type FakeComment = Partial<RawUEComment>;
export type FakeCommentUpvote = Partial<RawUECommentUpvote>;
export type FakeCommentReply = Partial<RawUECommentReply>;
export type FakeUECreditCategory = Partial<RawUECreditCategory>;

export interface FakeEntityMap {
  assoMembership: {
    entity: FakeAssoMembership;
    params: CreateAssoMembership;
    deps: { asso: FakeAsso; user: FakeUser };
  };
  association: {
    entity: FakeAsso;
    params: CreateAsso;
  };
  timetableEntryOverride: {
    entity: Partial<FakeTimetableEntryOverride>;
    params: CreateTimetableEntryOverrideParameters;
    deps: { entry: FakeTimetableEntry };
  };
  timetableEntry: {
    entity: Partial<FakeTimetableEntry>;
    params: CreateTimetableEntryParameters;
  };
  timetableGroup: {
    entity: FakeTimetableGroup;
    params: CreateTimetableGroupParams;
  };
  user: {
    entity: FakeUser;
    params: FakeUser & { password?: string };
  };
  branch: {
    entity: FakeBranch;
    params: CreateBranchParameters;
  };
  branchOption: {
    entity: FakeBranchOption;
    params: CreateBranchOptionParameters;
    deps: { branch: FakeBranch };
  };
  semester: {
    entity: FakeSemester;
    params: CreateSemesterParameters;
  };
  ue: {
    entity: FakeUE;
    params: CreateUEParameters;
    deps: { branchOption: FakeBranchOption; semesters: FakeSemester[] };
  };
  userUESubscription: {
    entity: FakeUserUESubscription;
    params: CreateUserSubscriptionParameters;
    deps: { user: FakeUser; ue: FakeUE; semester: FakeSemester };
  };
  ueCriterion: {
    entity: FakeUEStarCriterion;
    params: CreateCriterionParameters;
  };
  ueStarVote: {
    entity: FakeUEStarVote;
    params: CreateUERatingParameters;
    deps: { user: FakeUser; criterion: FakeUEStarCriterion; ue: FakeUE };
  };
  comment: {
    entity: FakeComment;
    params: CreateCommentParameters;
    deps: { user: FakeUser; ue: FakeUE; semester: FakeSemester };
  };
  commentUpvote: {
    entity: FakeCommentUpvote;
    params: CreateCommentUpvoteParameters;
    deps: { user: FakeUser; comment: FakeComment };
  };
  commentReply: {
    entity: FakeCommentReply;
    params: CreateCommentReplyParameters;
    deps: { user: FakeUser; comment: FakeComment };
  };
  ueCreditCategory: {
    entity: FakeUECreditCategory;
    params: CreateUECreditCategoryParameters;
  };
}

/**
 * Creates a user in the database.
 * @param app The function that returns the app.
 * @param rawParams The parameters to use to create the user.
 * @returns {@link FakeUser}
 */
export const createUser = entityFaker(
  'user',
  {
    login: faker.internet.userName,
    studentId: faker.datatype.number,
    sex: 'OTHER' as Sex,
    lastName: faker.name.lastName,
    firstName: faker.name.firstName,
    userType: 'STUDENT' as UserType,
    birthday: new Date(0),
    password: faker.internet.password,
  },
  async (app, params) => {
    const user = await app()
      .get(PrismaService)
      .user.create({
        data: {
          hash: params.hash ?? (await app().get(AuthService).getHash(params.password)),
          ...pick(params, 'id', 'login', 'studentId', 'firstName', 'lastName', 'userType'),
          infos: { create: pick(params, 'birthday', 'sex', 'nickname') },
          rgpd: { create: {} },
          preference: {
            create: {},
          },
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
    return {
      ...omit(user, 'infos', 'permissions'),
      ...omit(user.infos, 'id'),
      permissions: user.permissions.map((perm) => perm.userPermissionId),
      token: await app().get(AuthService).signToken(user.id, user.login),
    };
  },
);

export type CreateAssoMembership = FakeAssoMembership;
/**
 * Creates an association membership in the database.
 * @param app The function that returns the app.
 * @param rawParams The parameters to use to create the user.
 * @returns {@link FakeAssoMembership}
 */
export const createAssoMembership = entityFaker(
  'assoMembership',
  {
    startAt: new Date(0),
    endAt: new Date(0),
    createdAt: new Date(0),
    userId: faker.datatype.uuid,
    assoId: faker.datatype.uuid,
    role: {
      role: faker.random.words,
    },
  },
  async (app, dependencies, params) =>
    app()
      .get(PrismaService)
      .assoMembership.create({
        data: {
          ...omit(params, 'userId', 'assoId', 'assoMembershipId'),
          asso: {
            connect: {
              id: dependencies.asso.id,
            },
          },
          user: {
            connect: {
              id: dependencies.user.id,
            },
          },
          role: {
            create: {
              role: params.role.role,
            },
          },
        },
        include: {
          role: true,
        },
      }),
);

export type CreateAsso = FakeAsso;
/**
 * Creates an association in the database.
 * @param app The function that returns the app.
 * @param rawParams The parameters to use to create the association.
 * @returns {@link FakeAsso}
 */
export const createAsso = entityFaker(
  'association',
  {
    login: faker.internet.userName,
    name: faker.name.firstName,
    mail: faker.datatype.string,
    deletedAt: new Date(0),
  },
  async (app, params) =>
    app()
      .get(PrismaService)
      .asso.create({
        data: {
          ...omit(params, 'login', 'name', 'descriptionShortTranslationId', 'descriptionTranslationId'),
          login: params.login,
          name: params.name,
          mail: params.mail,
          descriptionTranslation: {
            create: {
              id: params.descriptionTranslationId,
            },
          },
          descriptionShortTranslation: {
            create: {
              id: params.descriptionShortTranslationId,
            },
          },
        },
      }),
);

export type CreateTimetableGroupParams = { users?: Array<{ user: FakeUser; priority: number }> };
/**
 * Creates a timetableGroup in the database.
 * @param app The function that returns the app.
 * @param rawParams The parameters to use to create the group.
 * @param onTheFly If false, the creation will be done in a beforeAll block.
 * @returns {@link FakeTimetableGroup}
 */
export const createTimetableGroup = entityFaker(
  'timetableGroup',
  {
    users: [],
  },
  async (app, params) => {
    return app()
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
  },
);

export type CreateTimetableEntryParameters = FakeTimetableEntry & { groups?: FakeTimetableGroup[] };
/**
 * Creates a timetableEntry in the database.
 * @param app The function that returns the app.
 * @param rawParams The parameters to use to create the entry.
 * @param onTheFly If false, the creation will be done in a beforeAll block.
 * @returns {@link FakeTimetableEntry}
 */
export const createTimetableEntry = entityFaker(
  'timetableEntry',
  {
    eventStart: new Date(0),
    occurrenceDuration: 0,
    occurrencesCount: 1,
    repeatEvery: 0,
    type: 'CUSTOM' as TimetableEntryType,
    location: faker.address.cityName,
    groups: [],
  },
  (app, params) =>
    app()
      .get(PrismaService)
      .timetableEntry.create({
        data: {
          timetableGroups: { connect: params.groups.map((group) => ({ id: group.id })) },
          ...omit(params, 'groups', 'eventId', 'ueCourseId'),
        },
      }),
);

export type CreateTimetableEntryOverrideParameters = {
  groups?: FakeTimetableGroup[];
} & Partial<FakeTimetableEntryOverride>;
export const createTimetableEntryOverride = entityFaker(
  'timetableEntryOverride',
  {
    groups: [],
    applyFrom: 0,
    applyUntil: 0,
  },
  async (app, dependencies, params) =>
    app()
      .get(PrismaService)
      .timetableEntryOverride.create({
        data: {
          overrideTimetableEntry: { connect: { id: dependencies.entry.id } },
          timetableGroups: { connect: params.groups.map((group) => ({ id: group.id })) },
          ...omit(params, 'groups', 'overrideTimetableEntryId'),
        },
      }),
);

export type CreateBranchParameters = FakeBranch;
export const createBranch = entityFaker(
  'branch',
  {
    code: faker.db.branch.code,
    name: faker.name.jobTitle,
  },
  async (app, params) =>
    app()
      .get(PrismaService)
      .uTTBranch.create({
        data: {
          ...omit(params, 'descriptionTranslationId'),
          descriptionTranslation: {
            create: {
              id: params.descriptionTranslationId,
            },
          },
        },
      }),
);

export type CreateBranchOptionParameters = FakeBranchOption;
export const createBranchOption = entityFaker(
  'branchOption',
  {
    code: faker.db.branchOption.code,
    name: faker.name.jobTitle,
  },
  async (app, dependencies, params) =>
    app()
      .get(PrismaService)
      .uTTBranchOption.create({
        data: {
          code: params.code,
          name: params.name,
          branch: {
            connect: {
              code: dependencies.branch.code,
            },
          },
          descriptionTranslation: {
            create: {
              id: params.descriptionTranslationId,
            },
          },
        },
      }),
);

export type CreateSemesterParameters = FakeSemester;
export const createSemester = entityFaker(
  'semester',
  {
    code: faker.db.semester.code,
    start: faker.date.past,
    end: faker.date.past,
  },
  async (app, params) => {
    return app().get(PrismaService).semester.create({
      data: params,
    });
  },
);

export type CreateUEParameters = FakeUE;
export const createUE = entityFaker(
  'ue',
  {
    code: faker.db.ue.code,
    name: faker.name.jobTitle,
    credits: [
      {
        category: {
          code: faker.db.ueCreditCategory.code,
          name: faker.name.jobTitle,
        },
        credits: () => faker.datatype.number({ min: 1, max: 6 }),
      },
    ],
    info: {
      program: faker.random.words,
      objectives: faker.random.words,
    },
    workTime: {
      cm: () => faker.datatype.number({ min: 0, max: 100 }),
      td: () => faker.datatype.number({ min: 0, max: 100 }),
      tp: () => faker.datatype.number({ min: 0, max: 100 }),
      the: () => faker.datatype.number({ min: 0, max: 100 }),
      project: () => faker.datatype.number({ min: 0, max: 100 }),
      internship: () => faker.datatype.number({ min: 0, max: 100 }),
    },
  },
  async (app, dependencies, params) =>
    app()
      .get(PrismaService)
      .uE.create({
        data: {
          ...omit(params, 'credits', 'info', 'workTime', 'inscriptionCode'),
          inscriptionCode: params.inscriptionCode ?? params.code,
          credits: {
            create: params.credits.map((credit) => ({
              category: {
                connectOrCreate: {
                  create: credit.category,
                  where: { code: credit.category.code },
                },
              },
              credits: credit.credits,
            })),
          },
          info: {
            create: omit(params.info, 'ueId', 'requirements'),
          },
          workTime: {
            create: params.workTime,
          },
          branchOption: {
            connect: {
              code: dependencies.branchOption.code,
            },
          },
          openSemester: {
            connect: dependencies.semesters.map((semester) => ({
              code: semester.code,
            })),
          },
        },
        include: {
          info: {
            include: {
              requirements: {
                select: {
                  code: true,
                },
              },
            },
          },
          workTime: true,
          credits: {
            include: {
              category: true,
            },
          },
          openSemester: true,
          branchOption: {
            include: {
              branch: true,
            },
          },
        },
      })
      .then((ue) => ({
        ...omit(ue, 'openSemester'),
        openSemesters: ue.openSemester,
      })),
);

export type CreateUserSubscriptionParameters = FakeUserUESubscription;
export const createUESubscription = entityFaker('userUESubscription', {}, async (app, dependencies, params) =>
  app()
    .get(PrismaService)
    .userUESubscription.create({
      data: {
        ...omit(params, 'semesterId', 'ueId', 'userId'),
        semester: {
          connect: {
            code: dependencies.semester.code,
          },
        },
        ue: {
          connect: {
            code: dependencies.ue.code,
          },
        },
        user: {
          connect: {
            id: dependencies.user.id,
          },
        },
      },
    }),
);

export type CreateCriterionParameters = FakeUEStarCriterion;
export const createCriterion = entityFaker(
  'ueCriterion',
  {
    name: faker.word.adjective,
  },
  async (app, params) =>
    app()
      .get(PrismaService)
      .uEStarCriterion.create({
        data: {
          ...omit(params, 'descriptionTranslationId'),
          descriptionTranslation: {
            create: {
              id: params.descriptionTranslationId,
            },
          },
        },
      }),
);

export type CreateUERatingParameters = FakeUEStarVote;
export const createUERating = entityFaker(
  'ueStarVote',
  {
    value: faker.db.ueStarVote.value,
  },
  async (app, dependencies, params) =>
    app()
      .get(PrismaService)
      .uEStarVote.create({
        data: {
          ...omit(params, 'criterionId', 'ueId', 'userId'),
          criterion: {
            connect: {
              id: dependencies.criterion.id,
            },
          },
          ue: {
            connect: {
              code: dependencies.ue.code,
            },
          },
          user: {
            connect: {
              id: dependencies.user.id,
            },
          },
        },
      }),
);

export type CreateCommentParameters = FakeComment;
export const createComment = entityFaker(
  'comment',
  {
    body: faker.random.words,
    isAnonymous: faker.datatype.boolean,
  },
  async (app, dependencies, params) =>
    app()
      .get(PrismaService)
      .uEComment.create({
        data: {
          ...omit(params, 'ueId', 'authorId', 'semesterId'),
          ue: {
            connect: {
              code: dependencies.ue.code,
            },
          },
          author: {
            connect: {
              id: dependencies.user.id,
            },
          },
          semester: {
            connect: {
              code: dependencies.semester.code,
            },
          },
        },
      }),
);

export type CreateCommentUpvoteParameters = FakeCommentUpvote;
export const createCommentUpvote = entityFaker('commentUpvote', {}, async (app, dependencies, params) =>
  app()
    .get(PrismaService)
    .uECommentUpvote.create({
      data: {
        ...omit(params, 'commentId', 'userId'),
        comment: {
          connect: {
            id: dependencies.comment.id,
          },
        },
        user: {
          connect: {
            id: dependencies.user.id,
          },
        },
      },
    }),
);

export type CreateCommentReplyParameters = FakeCommentReply;
export const createCommentReply = entityFaker(
  'commentReply',
  {
    body: faker.random.words,
  },
  async (app, dependencies, params) =>
    app()
      .get(PrismaService)
      .uECommentReply.create({
        data: {
          ...omit(params, 'commentId', 'authorId'),
          comment: {
            connect: {
              id: dependencies.comment.id,
            },
          },
          author: {
            connect: {
              id: dependencies.user.id,
            },
          },
        },
      }),
);

export type CreateUECreditCategoryParameters = FakeUECreditCategory;
export const createUECreditCategory = entityFaker(
  'ueCreditCategory',
  {
    name: faker.name.jobTitle,
    code: faker.db.ueCreditCategory.code,
  },
  async (app, params) => app().get(PrismaService).uECreditCategory.create({ data: params }),
);

/**
 * The return type of a fake function, either Promise<FakeEntity> or FakeEntity depending on whether OnTheFly is true or false
 */
type FakeFunctionReturn<FakeEntity extends Partial<FakeEntity>, OnTheFly extends boolean> = OnTheFly extends true
  ? Promise<FakeEntity>
  : FakeEntity;
/** Retrieves the return type of the generator of the given fakerFunction */
export type Entity<T extends keyof FakeEntityMap> = FakeEntityMap[T]['entity'];
/** Retrieves the type of parameters of the generator of the given fakerFunction */
type Params<T extends keyof FakeEntityMap> = FakeEntityMap[T]['params'];
/** Retrieves the type of dependencies of the generator of the given fakerFunction */
type Deps<T extends keyof FakeEntityMap> = FakeEntityMap[T] extends { deps: infer R } ? R : Record<string, never>;
/**
 * The type of the function that actually creates a fake entity. May include dependencies if
 * there are some registered in {@link FakeEntityMap}.
 */
type EntityFactory<T extends keyof FakeEntityMap, OptionalParams> = (
  app: AppProvider,
  ...args: EntityFactoryExtraArgs<T, OptionalParams>
) => Promise<Entity<T>>;
/** The arguments of the {@link EntityFactory} that are not the {@link AppProvider} */
type EntityFactoryExtraArgs<T extends keyof FakeEntityMap, OptionalParams> = FakeEntityMap[T] extends { deps: infer R }
  ? [deps: R, params: RuntimeParams<T> & Required<OptionalParams>]
  : [params: RuntimeParams<T> & Required<OptionalParams>];
/**
 * An object mapping all the optional properties that will be used (if provided) when creating the entity.
 */
type RuntimeParams<T extends keyof FakeEntityMap> = Partial<Params<T>>;
/**
 * The type of the function called to create a fake entity. May include dependencies if
 * there are some registered in {@link FakeEntityMap}.
 */
type FakeFunction<T extends keyof FakeEntityMap> = <OnTheFly extends boolean = false>(
  app: AppProvider,
  ...args: FakeEntityMap[T] extends { deps: infer Deps }
    ? [dependencies: Deps, rawParams?: RuntimeParams<T>, onTheFly?: OnTheFly]
    : [rawParams?: RuntimeParams<T>, onTheFly?: OnTheFly]
) => FakeFunctionReturn<Entity<T>, OnTheFly>;
/** Ensure {@link This} does not contain more properties that the ones defined in {@link Model} */
type ExclusiveProperties<This, Model> = {
  [K in keyof This]: K extends keyof Model ? Model[K] : never;
} & Model;

type DefaultParams<OptionalParams> = {
  [K in keyof OptionalParams]: (() => OptionalParams[K]) | DefaultParams<OptionalParams[K]>;
};

function deeplyCallFunctions<T>(params: T) {
  for (const key in params) {
    if (typeof params[key] === 'function') {
      params[key] = (params[key] as () => T[Extract<keyof T, string>])();
    } else if (typeof params[key] === 'object') {
      deeplyCallFunctions(params[key]);
    }
  }
}

/**
 * Creates a function that permits creating fake data.
 *
 * The function can now be called with 1-3 or 2-4 arguments.
 *
 * The first argument is the {@link AppProvider}.
 *
 * The second argument does or does not exist depending on how the function has been created :
 *   - If {@link FakeEntityMap FakeEntityMap[T]} contains a `deps` property, you must pass an object of the same type as {@link FakeEntityMap FakeEntityMap[T].deps}.
 *     This basically represents mandatory parameters to create the entity. This will often be other fake entities.
 *     For example, if you want to create a Restaurant and the Restaurant must have a manager, you may pass an object of type { manager: FakeUser } (see usage example under)
 *   - If {@link FakeEntityMap FakeEntityMap[T]} does not include a `deps` property, do not pass it.
 *
 * The last 2 arguments are optional.
 *
 * The second-to-last argument (2nd or 3rd depending on the above 2 points) is an object containing parameters that can be used to customize the object created.
 * Taking back the example of the restaurant, it may be the menu.
 * None of the parameters will be mandatory, which means you will always be able to pass an empty array.
 *
 * The last argument is a boolean, indicating whether to create the entity on the fly.
 *   - If set to {@code true}, the function will return a {@code Promise<FakeEntity>} (where {@code FakeEntity} is the type that interests you, for example {@link FakeUser}).
 *     This is useful when using the function in a it(), to create an entity for a specific test, that should not exist in any other test.
 *   - If set to {@code false}, the function will return a {@code FakeEntity}.
 *     This is useful in a describe for example, where you can't await, but also don't need to access the values directly.
 *     Note that this should still be usable as a parameter / dependency for another function created with {@link entityFaker}, as they do not require to read the content of the entity outside a beforeAll.
 *     This is the default behaviour.
 *
 * @param _kind The kind of entity to create. This is the key in {@link FakeEntityMap} that represents the entity. Any record in {@link FakeEntityMap} must contain:
 * an `entity` field, used to represent the type generated by this faker function;
 * a `params` field, used to represent all the parameters that can be given to the {@link EntityFactory generator function}.
 * A record may also include a `deps` field, used to represent all the dependencies that shall be given to the {@link EntityFactory generator function}.
 * @param defaultParams A function that takes no arguments and returns the default values of the parameters. The type of the object returned should be a subset of the one of {@link FakeEntityMap FakeEntityMap[T]}.
 * @param entityFactory A function that creates a new entity. It takes as parameter the application, the parameters (with the default value if they are empty) and if some with the dependencies.
 * @example
 * interface FakeEntityMap {
 *   restaurant: {
 *     entity: Partial<RawRestaurant>;
 *     params: { location: string; menu: string };
 *     deps: { manager: FakeUser };
 *   }
 * }
 * const createFakeRestaurant = entityFake(
 *   "restaurant",
 *   () => ({ location: "@see Google Maps" }),
 *   async (app, dependencies, params) =>
 *     app().get(PrismaService)
 *     .create({
 *       data: {
 *         location: params.location,
 *         menu: params.menu,
 *         manager: { connect: { id: dependencies.manager.id } }
 *       }
 *     }),
 * );
 * const user = createFakeUser(app); // createFakeUser() has been created the same way.
 * const restaurant1 = createFakeRestaurant(app, { manager: user }); // This will be created in a beforeAll automatically. You will be able to use the fields of restaurant1 in the it().
 *                                                                     // Note that user is not accessible yet, but you can still use it in dependencies and params
 * const restaurant2 = await createFakeRestaurant(app, { manager: user }, { menu: "grenouilles" }, true); // Creates the restaurant on the fly, as soon as this line finishes executing, a restaurant will have been created in the database.
 *                                                                                                        // You will be able to exploit the fields of the object right after.
 *                                                                                                        // This usage is very useful in it() functions, to be able to create objects on the fly
 */
function entityFaker<
  T extends keyof FakeEntityMap,
  OptionalParams extends ExclusiveProperties<OptionalParams, Params<T>>,
>(
  _kind: T,
  defaultParams: DefaultParams<OptionalParams>,
  entityFactory: EntityFactory<T, OptionalParams>,
): FakeFunction<T> {
  const func = <OnTheFly extends boolean = false>(
    app: AppProvider,
    dependencies: Deps<T>,
    rawParams: RuntimeParams<T> = {},
    onTheFly: OnTheFly = false as OnTheFly,
  ): FakeFunctionReturn<Entity<T>, OnTheFly> => {
    const lazyEntity: Entity<T> = {};
    // We're being evaluated in describe(...) so we cannot evaluate defaultParams here (in the case `onTheFly` is set to false)
    // and we delay the evaluation with `factory()` used as a wrapper function.
    const factory = async () => {
      // We concatenate default params with params to ensure we have all the params
      const params = {
        ...defaultParams,
        ...rawParams,
      } as Params<T>;
      // If a default param is a function, call it. We need to do it recursively to support nested objects.
      deeplyCallFunctions(params);
      // We generate the parameters of the entity generator (`entityFactory` in the code below)
      const factoryDepsParams = (
        entityFactory.length !== 2 ? [dependencies, params] : [params]
      ) as EntityFactoryExtraArgs<T, OptionalParams>;
      const entity = await entityFactory(app, ...factoryDepsParams);
      return Object.assign(lazyEntity, entity);
    };
    if (onTheFly === true) {
      return factory() as OnTheFly extends true ? Promise<Entity<T>> : never;
    }
    beforeAll(factory);
    return lazyEntity as OnTheFly extends true ? never : Entity<T>;
  };
  if (entityFactory.length === 2) {
    return (<OnTheFly extends boolean = false>(
      app: AppProvider,
      rawParams: RuntimeParams<T> = {},
      onTheFly: OnTheFly = false as OnTheFly,
    ) => func(app, {} as Deps<T>, rawParams, onTheFly)) as FakeFunction<T>;
  }
  return func as FakeFunction<T>;
}
