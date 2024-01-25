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
export type FakeUser = Partial<RawUser & RawUserInfos & { permissions: string[]; token: string }>;
export type FakeTimetableGroup = Partial<RawTimetableGroup>;
export type FakeTimetableEntry = Partial<RawTimetableEntry>;
export type FakeTimetableEntryOverride = Partial<RawTimetableEntryOverride>;

/**
 * Creates a user in the database.
 * @param app The function that returns the app.
 * @param rawParams The parameters to use to create the user.
 * @returns {@link FakeUser}
 */
export const createUser = entityFaker(
  () => ({
    login: faker.internet.userName(),
    studentId: faker.datatype.number(),
    sex: 'OTHER' as Sex,
    lastName: faker.name.lastName(),
    firstName: faker.name.firstName(),
    role: 'STUDENT' as UserRole,
    birthday: new Date(0),
    password: faker.internet.password(),
  }),
  async (app, params) => {
    const user = await app()
      .get(PrismaService)
      .user.create({
        data: {
          hash: params.hash ?? (await app().get(AuthService).getHash(params.password)),
          ...pick(params, 'id', 'login', 'studentId', 'firstName', 'lastName', 'role'),
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
    return {
      ...omit(user, 'infos', 'permissions'),
      ...omit(user.infos, 'id'),
      permissions: user.permissions.map((perm) => perm.userPermissionId),
      token: await app().get(AuthService).signToken(user.id, user.login),
    };
  },
  null as FakeUser,
  null as Required<FakeUser & { password?: string }>,
  null as Record<string, never>,
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
  () => ({
    users: [],
  }),
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
  null as FakeTimetableGroup,
  null as Required<CreateTimetableGroupParams>,
  null as Record<string, never>,
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
  () => ({
    eventStart: new Date(0),
    occurrenceDuration: 0,
    occurrencesCount: 1,
    repeatEvery: 0,
    type: 'CUSTOM' as TimetableEntryType,
    location: faker.address.cityName(),
    groups: [],
  }),
  (app, params) =>
    app()
      .get(PrismaService)
      .timetableEntry.create({
        data: {
          timetableGroups: { connect: params.groups.map((group) => ({ id: group.id })) },
          ...omit(params, 'groups', 'eventId', 'ueCourseId'),
        },
      }),
  null as FakeTimetableEntry,
  null as Required<CreateTimetableEntryParameters>,
  null as Record<string, never>,
);

export type CreateTimetableEntryOverrideParameters = {
  groups?: FakeTimetableGroup[];
} & Partial<FakeTimetableEntryOverride>;
export const createTimetableEntryOverride = entityFaker(
  () => ({
    groups: [],
    applyFrom: 0,
    applyUntil: 0,
  }),
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
  null as FakeTimetableEntryOverride,
  null as Required<CreateTimetableEntryOverrideParameters>,
  null as { entry: FakeTimetableEntry },
);

type UECreationOptions<T extends boolean> = {
  code?: string;
  category?: string;
  branchOption?: string;
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
  {
    code = 'XX00',
    category = 'CS',
    branchOption = 'JSP',
    branch = 'JSP_BR',
    semester = 'A24',
    forOverview = false,
  } = {},
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
      branchOption: {
        connectOrCreate: {
          create: {
            code: branchOption,
            name: branchOption,
            branch: {
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
            code: branchOption,
          },
        },
      },
      info: {
        create: {
          program: 'What is going to be studied',
          objectives: 'The objectives of the UE',
        },
      },
      workTime: {
        create: {
          cm: 20,
          td: 20,
          tp: 16,
          the: 102,
          project: 48,
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
          ue: {
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
          ue: {
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
          ue: {
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
            ue: { connect: { code: onUE.code } },
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
      await app().get(UEService).replyComment(user.id, comment.id, {
        body: "Bouboubou je suis pas d'accord",
      }),
    );
  });
  return lazyReply;
}

/**
 * Represents a function to generate an entity, which may need dependencies or not.
 * @see EntityFactoryWithoutDependencies
 * @see EntityFactoryWithDependencies
 */
type EntityFactory<
  FakeEntity extends Partial<object>,
  Params extends object,
  Keys extends keyof Params,
  Dependencies extends object,
> = Dependencies extends Record<string, never>
  ? EntityFactoryWithoutDependencies<FakeEntity, Params, Keys>
  : EntityFactoryWithDependencies<FakeEntity, Params, Keys, Dependencies>;
/**
 * Represents a function to generate an entity, which does not need dependencies to be executed.
 */
type EntityFactoryWithoutDependencies<
  FakeEntity extends Partial<object>,
  Params extends object,
  Keys extends keyof Params,
> = (app: AppProvider, params: UnpartialFields<Params, Keys>) => Promise<FakeEntity>;
/**
 * Represents a function to generate an entity, which needs dependencies to be executed.
 */
type EntityFactoryWithDependencies<
  FakeEntity extends Partial<object>,
  Params extends object,
  Keys extends keyof Params,
  Dependencies extends object,
> = (app: AppProvider, dependencies: Dependencies, params: UnpartialFields<Params, Keys>) => Promise<FakeEntity>;

/**
 * A fake function which does not have dependencies.
 */
type FakeFunctionWithoutDependencies<FakeEntity extends Partial<object>, Params extends object> = <
  OnTheFly extends boolean = false,
>(
  app: AppProvider,
  rawParams?: Partial<Params>,
  onTheFly?: OnTheFly,
) => FakeFunctionReturn<FakeEntity, OnTheFly>;
/**
 * A fake function which has dependencies.
 */
type FakeFunctionWithDependencies<
  FakeEntity extends Partial<object>,
  Params extends object,
  Dependencies extends object,
> = <OnTheFly extends boolean = false>(
  app: AppProvider,
  dependencies: Dependencies,
  rawParams?: Partial<Params>,
  onTheFly?: OnTheFly,
) => FakeFunctionReturn<FakeEntity, OnTheFly>;
/**
 * The return type of a fake function, either Promise<FakeEntity> or FakeEntity depending on whether OnTheFly is true or false
 */
type FakeFunctionReturn<FakeEntity extends Partial<object>, OnTheFly extends boolean> = OnTheFly extends true
  ? Promise<FakeEntity>
  : FakeEntity;
/**
 * Creates a function that permits creating fake data.
 *
 * The function can now be called with 1-3 or 2-4 arguments.
 *
 * The first argument is the {@link AppProvider}.
 *
 * The second argument does or does not exist depending on how the function has been created :
 *   - If {@link _dependenciesType} is not an empty object (not {@code Record<string, never>}), you must pass an object of the same type as {@link _dependenciesType}.
 *     This basically represents mandatory parameters to create the entity. This will often be other fake entities.
 *     For example, if you want to create a Restaurant and the Restaurant must have a manager, you may pass an object of type { manager: FakeUser } (see usage example under)
 *   - If {@link _dependenciesType} is an empty object ({@code Record<string, never>}), do not pass it.
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
 * @param defaultParams A function that takes no arguments and returns the default values of the parameters. The type of the object returned should be a subset of the one of {@link _paramsType}.
 * @param entityFactory A function that creates a new entity. It takes as parameter the application, the parameters (with the default value if they are empty) and if some with the dependencies.
 * @param _fakeEntityType You can pass null to this value. Make it of the type of your fake entity.
 * @param _paramsType You can pass null to this value. Make it of the type of the params you are expecting from the user. These parameters will all be optional.
 * @param _dependenciesType You can pass null to this value. Make it of the type of the mandatory parameters, it will often be other fake entities.
 * @example
 * const createFakeRestaurant = entityFake(
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
 *   null as Partial<RawRestaurant>,
 *   null as Required<{ location: string; menu: string }>
 *   null as { manager: FakeUser }
 * );
 * const user = createFakeUser(app); // createFakeUser() has been created the same way.
 * const restaurant1 = createFakeRestaurant(app, { manager: user }); // This will be created in a beforeAll automatically. You will be able to use the fields of restaurant1 in the it().
 *                                                                     // Note that user is not accessible yet, but you can still use it in dependencies and params
 * const restaurant2 = await createFakeRestaurant(app, { manager: user }, { menu: "grenouilles" }, true); // Creates the restaurant on the fly, as soon as this line finishes executing, a restaurant will have been created in the database.
 *                                                                                                        // You will be able to exploit the fields of the object right after.
 *                                                                                                        // This usage is very useful in it() functions, to be able to create objects on the fly
 */
function entityFaker<
  FakeEntity extends Partial<object>,
  Params extends DefaultParams,
  DefaultParams extends Required<object>,
  Dependencies extends object,
>(
  defaultParams: () => DefaultParams,
  entityFactory: EntityFactory<FakeEntity, Params, keyof DefaultParams, Dependencies>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _fakeEntityType: FakeEntity,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _paramsType: Params,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _dependenciesType: Dependencies,
): Dependencies extends Record<string, never>
  ? FakeFunctionWithoutDependencies<FakeEntity, Params>
  : FakeFunctionWithDependencies<FakeEntity, Params, Dependencies> {
  const func: FakeFunctionWithDependencies<FakeEntity, Params, Dependencies> = <OnTheFly extends boolean = false>(
    app: AppProvider,
    dependencies: Dependencies,
    rawParams: Partial<Params> = {},
    onTheFly: OnTheFly = false as OnTheFly,
  ): FakeFunctionReturn<FakeEntity, OnTheFly> => {
    const params: UnpartialFields<Params, keyof DefaultParams> = {
      ...defaultParams(),
      ...rawParams,
    } as UnpartialFields<Params, keyof DefaultParams>;
    const lazyEntity: FakeEntity = {} as FakeEntity;
    const factory =
      entityFactory.length === 2
        ? () =>
            (entityFactory as EntityFactoryWithoutDependencies<FakeEntity, Params, keyof DefaultParams>)(
              app,
              params,
            ).then((res) => Object.assign(lazyEntity, res))
        : () =>
            (entityFactory as EntityFactoryWithDependencies<FakeEntity, Params, keyof DefaultParams, Dependencies>)(
              app,
              dependencies,
              params,
            ).then((res) => Object.assign(lazyEntity, res));
    if (onTheFly === true) {
      return factory() as OnTheFly extends true ? Promise<FakeEntity> : never;
    }
    beforeAll(factory);
    return lazyEntity as OnTheFly extends true ? never : FakeEntity;
  };
  if (entityFactory.length === 2) {
    return (<OnTheFly extends boolean = false>(
      app: AppProvider,
      rawParams: Partial<Params> = {},
      onTheFly: OnTheFly = false as OnTheFly,
    ) => func(app, {} as Dependencies, rawParams, onTheFly)) as Dependencies extends Record<string, never>
      ? FakeFunctionWithoutDependencies<FakeEntity, Params>
      : never;
  }
  return func as Dependencies extends Record<string, never>
    ? never
    : FakeFunctionWithDependencies<FakeEntity, Params, Dependencies>;
}
