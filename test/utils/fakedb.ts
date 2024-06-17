import {
  RawAsso,
  RawAssoMembership,
  RawAssoMembershipRole,
  RawBranch,
  RawBranchOption,
  RawCreditCategory,
  RawHomepageWidget,
  RawSemester,
  RawTimetableEntry,
  RawTimetableEntryOverride,
  RawTimetableGroup,
  RawUe,
  RawAnnalType,
  RawUeComment,
  RawUeCommentReply,
  RawUeCommentUpvote,
  RawUeCredit,
  RawUeInfo,
  RawUeStarCriterion,
  RawUeStarVote,
  RawUeWorkTime,
  RawUser,
  RawUserAddress,
  RawUserBranchSubscription,
  RawUserInfos,
  RawUserMailsPhones,
  RawUserPreference,
  RawUserSocialNetwork,
  RawUserUeSubscription,
  Translation,
} from '../../src/prisma/types';
import { faker } from '@faker-js/faker';
import { AuthService } from '../../src/auth/auth.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AppProvider } from './test_utils';
import { Sex, TimetableEntryType, UserType } from '@prisma/client';
import { CommentStatus } from '../../src/ue/comments/interfaces/comment.interface';
import { UeAnnalFile } from '../../src/ue/annals/interfaces/annal.interface';
import { omit, pick, translationSelect } from '../../src/utils';

/**
 * The fake entities can be used like normal entities in the <code>it(string, () => void)</code> functions.
 * They are what is returned by the functions in this file.
 */
export type FakeUser = Partial<RawUser> & {
  infos?: Partial<RawUserInfos>;
  permissions?: string[];
  token?: string;
  mailsPhones?: Partial<RawUserMailsPhones>;
  addresses?: Array<Partial<RawUserAddress>>;
  socialNetwork?: Partial<RawUserSocialNetwork>;
  preference?: Partial<RawUserPreference>;
  branchSubscriptions?: Array<
    Partial<RawUserBranchSubscription> & {
      branch?: Partial<RawBranch>;
      branchOption?: Partial<RawBranchOption>;
      semester?: Partial<RawSemester>;
    }
  >;
};
export type FakeTimetableGroup = Partial<RawTimetableGroup>;
export type FakeTimetableEntry = Partial<RawTimetableEntry>;
export type FakeTimetableEntryOverride = Partial<RawTimetableEntryOverride>;
export type FakeBranch = Partial<RawBranch>;
export type FakeBranchOption = Partial<RawBranchOption>;
export type FakeAssoMembershipRole = Partial<RawAssoMembershipRole>;
export type FakeAssoMembership = Partial<RawAssoMembership> & {
  role?: Partial<RawAssoMembershipRole>;
};
export type FakeAsso = Partial<
  RawAsso & {
    descriptionShortTranslation: Partial<Translation>;
    descriptionTranslation: Partial<Translation>;
    president: Partial<RawUser>;
  }
>;
export type FakeSemester = Partial<RawSemester>;
export type FakeUe = Partial<Omit<RawUe, 'nameTranslationId' | 'ueInfoId'>> & {
  name?: Partial<Translation>;
  credits?: (Partial<RawUeCredit> & { category: RawCreditCategory })[];
  info?: Partial<
    Omit<RawUeInfo, 'commentTranslationId' | 'objectivesTranslationId' | 'programTranslationId'> & {
      comment: Partial<Translation>;
      objectives: Partial<Translation>;
      program: Partial<Translation>;
      requirements: { code: string }[];
    }
  >;
  workTime?: Partial<RawUeWorkTime>;
  openSemesters?: Partial<RawSemester>[];
  branchOption?: Partial<RawBranchOption & { branch: RawBranch }>[];
};
export type FakeUserUeSubscription = Partial<RawUserUeSubscription>;
export type FakeUeStarCriterion = Partial<RawUeStarCriterion>;
export type FakeUeStarVote = Partial<RawUeStarVote>;
export type FakeComment = Partial<RawUeComment> & { status: Exclude<CommentStatus, CommentStatus.PROCESSING> };
export type FakeCommentUpvote = Partial<RawUeCommentUpvote>;
export type FakeCommentReply = Partial<RawUeCommentReply> & {
  status: Exclude<CommentStatus, CommentStatus.PROCESSING | CommentStatus.UNVERIFIED>;
};
export type FakeUeCreditCategory = Partial<RawCreditCategory>;
export type FakeUeAnnalType = Partial<RawAnnalType>;
export type FakeUeAnnal = Partial<UeAnnalFile>;
export type FakeHomepageWidget = Partial<RawHomepageWidget>;

export interface FakeEntityMap {
  assoMembership: {
    entity: FakeAssoMembership;
    params: CreateAssoMembershipParameters;
    deps: { asso: FakeAsso; user: FakeUser; role: FakeAssoMembershipRole };
  };
  assoMembershipRole: {
    entity: FakeAssoMembershipRole;
    params: CreateAssoMembershipRoleParameters;
    deps: { asso: FakeAsso };
  };
  association: {
    entity: FakeAsso;
    params: CreateAssoParameters;
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
    params: CreateUserParameters;
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
    entity: FakeUe;
    params: CreateUeParameters;
  };
  userUeSubscription: {
    entity: FakeUserUeSubscription;
    params: CreateUserSubscriptionParameters;
    deps: { user: FakeUser; ue: FakeUe; semester: FakeSemester };
  };
  ueCriterion: {
    entity: FakeUeStarCriterion;
    params: CreateCriterionParameters;
  };
  ueStarVote: {
    entity: FakeUeStarVote;
    params: CreateUeRatingParameters;
    deps: { user: FakeUser; criterion: FakeUeStarCriterion; ue: FakeUe };
  };
  comment: {
    entity: FakeComment;
    params: CreateCommentParameters & {
      status: Exclude<CommentStatus, CommentStatus.PROCESSING>;
    };
    deps: { user: FakeUser; ue: FakeUe; semester: FakeSemester };
  };
  commentUpvote: {
    entity: FakeCommentUpvote;
    params: CreateCommentUpvoteParameters;
    deps: { user: FakeUser; comment: FakeComment };
  };
  commentReply: {
    entity: FakeCommentReply;
    params: CreateCommentReplyParameters & {
      status: Exclude<CommentStatus, CommentStatus.PROCESSING | CommentStatus.UNVERIFIED>;
    };
    deps: { user: FakeUser; comment: FakeComment };
  };
  ueCreditCategory: {
    entity: FakeUeCreditCategory;
    params: CreateUeCreditCategoryParameters;
  };
  annalType: {
    entity: FakeUeAnnalType;
    params: FakeUeAnnalType;
  };
  annal: {
    entity: FakeUeAnnal;
    params: {
      status: CommentStatus;
    };
    deps: {
      type: FakeUeAnnalType;
      semester: FakeSemester;
      ue: FakeUe;
      sender: FakeUser;
    };
  };
  homepageWidget: {
    entity: FakeHomepageWidget;
    params: CreateHomepageWidgetParameters;
    deps: { user: FakeUser };
  };
}

export type CreateUserParameters = FakeUser & { password: string };
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
    lastName: faker.name.lastName,
    firstName: faker.name.firstName,
    userType: 'STUDENT' as UserType,
    password: faker.internet.password,
    infos: {
      sex: 'OTHER' as Sex,
      birthday: new Date(0),
      nickname: faker.datatype.string,
    },
    addresses: [
      {
        street: faker.address.street,
        postalCode: faker.address.zipCode,
        city: faker.address.city,
        country: faker.address.country,
      },
    ],
    branchSubscriptions: [],
    permissions: [],
  },
  async (app, params) => {
    const permissions = await app()
      .get(PrismaService)
      .userPermission.findMany({
        where: {
          id: {
            in: params.permissions,
          },
        },
      });
    permissions.push(
      ...(await Promise.all(
        (params.permissions ?? [])
          .filter((perm) => !permissions.some((p) => p.id === perm))
          .map((perm) =>
            app()
              .get(PrismaService)
              .userPermission.create({
                data: {
                  id: perm,
                  name: {
                    create: {},
                  },
                },
              }),
          ),
      )),
    );
    const user = await app()
      .get(PrismaService)
      .withDefaultBehaviour.user.create({
        data: {
          hash: params.hash ?? (await app().get(AuthService).getHash(params.password)),
          ...pick(params, 'id', 'login', 'studentId', 'firstName', 'lastName', 'userType'),
          infos: {
            create: {
              ...pick(params.infos, 'sex', 'nickname'),
              birthday: params.infos.birthday
                ? new Date(params.infos.birthday.getTime() - params.infos.birthday.getTimezoneOffset() * 60000)
                : null, // Add the 1h timezone offset (in you are in France ^^) to make the time the same as the one expected if you don't look at the timezone offset
            },
          },
          permissions: {
            createMany: {
              data: permissions.map((perm) => ({ userPermissionId: perm.id })),
            },
          },
          rgpd: { create: {} },
          preference: {
            create: {},
          },
          mailsPhones: { create: {} },
          addresses: {
            createMany: {
              data: params.addresses.map((address) => ({
                street: address.street,
                postalCode: address.postalCode,
                city: address.city,
                country: address.country,
              })),
            },
          },
          socialNetwork: { create: {} },
          branchSubscriptions: {
            createMany: {
              data: params.branchSubscriptions.map((branch) => ({
                semesterNumber: branch.semesterNumber,
                semesterCode: branch.semester.code,
                branchCode: branch.branch.code,
                branchOptionId: branch.branchOption.id,
              })),
            },
          },
        },
        include: {
          infos: true,
          permissions: {
            select: {
              userPermissionId: true,
            },
          },
          mailsPhones: true,
          addresses: {
            select: {
              street: true,
              postalCode: true,
              city: true,
              country: true,
            },
          },
          socialNetwork: true,
          preference: true,
          branchSubscriptions: {
            select: {
              semesterNumber: true,
              branchOption: { select: { code: true, branch: { select: { code: true } } } },
              semester: { select: { code: true } },
            },
          },
        },
      });
    return {
      ...user,
      permissions: user.permissions.map((perm) => perm.userPermissionId),
      token: await app().get(AuthService).signToken(user.id, user.login),
    };
  },
);

export type CreateAssoMembershipRoleParameters = FakeAssoMembershipRole;
/**
 * Creates an association membership role in the database.
 * @param app The function that returns the app.
 * @param rawParams The parameters to use to create the user.
 * @returns {@link FakeAssoMembershipRole}
 */
export const createAssoMembershipRole = entityFaker(
  'assoMembershipRole',
  {
    name: faker.company.name,
    position: faker.db.assoMembershipRole.position,
    isPresident: false,
  },
  async (app, dependencies, params) =>
    app()
      .get(PrismaService)
      .assoMembershipRole.create({
        data: {
          name: params.name,
          position: params.position,
          isPresident: params.isPresident,
          asso: {
            connect: {
              id: dependencies.asso.id,
            },
          },
        },
      }),
);

export type CreateAssoMembershipParameters = FakeAssoMembership;
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
  },
  async (app, dependencies, params) =>
    app()
      .get(PrismaService)
      .assoMembership.create({
        data: {
          ...omit(params, 'userId', 'assoId', 'roleId'),
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
            connect: {
              id: dependencies.role.id,
            },
          },
        },
        include: {
          role: true,
        },
      }),
);

export type CreateAssoParameters = FakeAsso;
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
    descriptionShortTranslation: {
      fr: faker.company.catchPhrase(),
      en: faker.company.catchPhrase(),
      es: faker.company.catchPhrase(),
      de: faker.company.catchPhrase(),
      zh: faker.company.catchPhrase(),
    },
    descriptionTranslation: {
      fr: faker.company.catchPhrase(),
      en: faker.company.catchPhrase(),
      es: faker.company.catchPhrase(),
      de: faker.company.catchPhrase(),
      zh: faker.company.catchPhrase(),
    },
  },
  async (app, params) => {
    const asso = await app()
      .get(PrismaService)
      .asso.create({
        data: {
          ...omit(params, 'login', 'name', 'descriptionShortTranslationId', 'descriptionTranslationId'),
          login: params.login,
          name: params.name,
          mail: params.mail,
          descriptionTranslation: { create: params.descriptionTranslation },
          descriptionShortTranslation: { create: params.descriptionShortTranslation },
        },
      });
    return { ...asso, president: null };
  },
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

export const createAnnalType = entityFaker(
  'annalType',
  {
    name: faker.random.word,
  },
  async (app, params) => {
    return app().get(PrismaService).ueAnnalType.create({ data: params });
  },
);

export const createAnnal = entityFaker(
  'annal',
  { status: CommentStatus.VALIDATED },
  async (app, { semester, sender, type, ue }, { status }) =>
    app()
      .get(PrismaService)
      .ueAnnal.create({
        data: {
          uploadComplete: !(status & CommentStatus.PROCESSING),
          deletedAt: status & CommentStatus.DELETED ? faker.date.recent() : null,
          validatedAt: status & CommentStatus.VALIDATED ? faker.date.past() : null,
          semesterId: semester.code,
          senderId: sender.id,
          typeId: type.id,
          ueId: ue.id,
        },
      }),
);

export type CreateUeParameters = FakeUe;
export const createUe = entityFaker(
  'ue',
  {
    code: faker.db.ue.code,
    name: () => faker.db.translation(faker.name.jobTitle),
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
      program: faker.db.translation,
      objectives: faker.db.translation,
    },
    workTime: {
      cm: () => faker.datatype.number({ min: 0, max: 100 }),
      td: () => faker.datatype.number({ min: 0, max: 100 }),
      tp: () => faker.datatype.number({ min: 0, max: 100 }),
      the: () => faker.datatype.number({ min: 0, max: 100 }),
      project: () => faker.datatype.number({ min: 0, max: 100 }),
      internship: () => faker.datatype.number({ min: 0, max: 100 }),
    },
    branchOption: [],
    openSemesters: [],
  },
  async (app, params) =>
    app()
      .get(PrismaService)
      .withDefaultBehaviour.ue.create({
        data: {
          ...omit(params, 'name', 'credits', 'info', 'workTime', 'inscriptionCode', 'openSemesters'),
          name: { create: params.name },
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
            create: {
              ...omit(params.info, 'requirements', 'comment', 'objectives', 'program'),
              comment: { create: params.info.comment },
              objectives: { create: params.info.objectives },
              program: { create: params.info.program },
            },
          },
          workTime: {
            create: params.workTime,
          },
          branchOption: {
            connect: params.branchOption.map((branchOption) => ({
              id: branchOption.id,
            })),
          },
          openSemester: {
            connect: params.openSemesters.map((semester) => ({
              code: semester.code,
            })),
          },
        },
        include: {
          name: translationSelect,
          info: {
            include: {
              requirements: {
                select: {
                  code: true,
                },
              },
              comment: translationSelect,
              objectives: translationSelect,
              program: translationSelect,
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
        ...omit(ue, 'openSemester', 'ueInfoId', 'nameTranslationId'),
        info: omit(ue.info, 'commentTranslationId', 'objectivesTranslationId', 'programTranslationId'),
        openSemesters: ue.openSemester,
      })),
);

export type CreateUserSubscriptionParameters = FakeUserUeSubscription;
export const createUeSubscription = entityFaker('userUeSubscription', {}, async (app, dependencies, params) =>
  app()
    .get(PrismaService)
    .userUeSubscription.create({
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

export type CreateCriterionParameters = FakeUeStarCriterion;
export const createCriterion = entityFaker(
  'ueCriterion',
  {
    name: faker.word.adjective,
  },
  async (app, params) =>
    app()
      .get(PrismaService)
      .ueStarCriterion.create({
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

export type CreateUeRatingParameters = FakeUeStarVote;
export const createUeRating = entityFaker(
  'ueStarVote',
  {
    value: faker.db.ueStarVote.value,
  },
  async (app, dependencies, params) => {
    return app()
      .get(PrismaService)
      .withDefaultBehaviour.ueStarVote.create({
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
      });
  },
);

export type CreateCommentParameters = FakeComment;
export const createComment = entityFaker(
  'comment',
  {
    body: faker.random.words,
    isAnonymous: faker.datatype.boolean,
    status: CommentStatus.VALIDATED,
  },
  async (app, dependencies, params) => {
    const rawFakeData = await app()
      .get(PrismaService)
      .withDefaultBehaviour.ueComment.create({
        data: {
          ...omit(params, 'ueId', 'authorId', 'semesterId', 'status'),
          validatedAt: params.status & CommentStatus.VALIDATED ? new Date() : undefined,
          deletedAt: params.status & CommentStatus.DELETED ? new Date() : undefined,
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
      });
    return { ...rawFakeData, status: params.status };
  },
);

export type CreateCommentUpvoteParameters = FakeCommentUpvote;
export const createCommentUpvote = entityFaker('commentUpvote', {}, async (app, dependencies, params) =>
  app()
    .get(PrismaService)
    .ueCommentUpvote.create({
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
    status: CommentStatus.VALIDATED,
  },
  async (app, dependencies, params) => {
    const rawFakeReply = await app()
      .get(PrismaService)
      .withDefaultBehaviour.ueCommentReply.create({
        data: {
          ...omit(params, 'commentId', 'authorId', 'status'),
          deletedAt: params.status & CommentStatus.DELETED ? new Date() : undefined,
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
      });
    return { ...rawFakeReply, status: params.status };
  },
);

export type CreateUeCreditCategoryParameters = FakeUeCreditCategory;
export const createUeCreditCategory = entityFaker(
  'ueCreditCategory',
  {
    name: faker.name.jobTitle,
    code: faker.db.ueCreditCategory.code,
  },
  async (app, params) => app().get(PrismaService).ueCreditCategory.create({ data: params }),
);

export type CreateHomepageWidgetParameters = FakeHomepageWidget;
export const createHomepageWidget = entityFaker(
  'homepageWidget',
  {
    widget: faker.datatype.string(),
    x: faker.datatype.number(10),
    y: faker.datatype.number(10),
    width: faker.datatype.number(10),
    height: faker.datatype.number(10),
  },
  async (app, deps, params) =>
    app()
      .get(PrismaService)
      .userHomepageWidget.create({ data: { ...omit(params, 'userId'), user: { connect: { id: deps.user.id } } } }),
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
  if (Array.isArray(params)) {
    for (const param of params) {
      deeplyCallFunctions(param);
    }
  } else {
    for (const key in params) {
      if (typeof params[key] === 'function') {
        params[key] = (params[key] as () => T[Extract<keyof T, string>])();
      } else if (typeof params[key] === 'object') {
        deeplyCallFunctions(params[key]);
      }
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
