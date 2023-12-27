import { PrismaService } from '../src/prisma/prisma.service';
import { INestApplication } from '@nestjs/common';
import { AuthService } from '../src/auth/auth.service';
import { AuthSignUpDto } from '../src/auth/dto';
import {
  Criterion,
  SelectCriterion,
} from '../src/ue/interfaces/criterion.interface';
import {
  SelectUEOverview,
  UEOverView,
} from '../src/ue/interfaces/ue-overview.interface';
import {
  SelectUEDetail,
  UEDetail,
} from '../src/ue/interfaces/ue-detail.interface';
import { UEService } from '../src/ue/ue.service';
import { User } from '../src/prisma/types';
import { UEComment } from '../src/ue/interfaces/comment.interface';
import { UECommentReply } from 'src/ue/interfaces/comment-reply.interface';

/** Type alias for the lambda used to retrieve the nest app */
type ApplicationContext = () => INestApplication;

/** Utilities to use in {@link Spec.expectJsonLike} to match database-generated values */
export const JsonLike = {
  STRING: "typeof $V === 'string'",
  ANY_UUID: /[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}/,
  ANY_DATE: /\d{4}-\d{2}-\d{2}T(\d{2}:){2}\d{2}.\d{3}Z/,
};

export function suite(name: string, func: (app: ApplicationContext) => void) {
  return (app: ApplicationContext) =>
    describe(name, () => {
      beforeAll(async () => {
        await app().get(PrismaService).cleanDb();
      });
      func(app);
    });
}

export function createUser(
  app: ApplicationContext,
  { login = 'user', studentId = 2 } = {},
) {
  const user = {
    login,
    studentId,
    sex: 'OTHER',
    lastName: 'user',
    firstName: 'user',
    birthday: new Date(Date.now()),
    password: 'password',
    role: 'STUDENT',
  } as AuthSignUpDto & User;
  const userWithToken: User & { token: string } = { ...user, token: '' };
  beforeAll(async () => {
    userWithToken.token = await app().get(AuthService).signup(user);
    const generatedUser = await app()
      .get(PrismaService)
      .user.findUnique({
        where: {
          login,
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
    const permissions = generatedUser.permissions.map(
      (perm) => perm.userPermissionId,
    );
    delete generatedUser.permissions;
    Object.assign(userWithToken, generatedUser);
    userWithToken.permissions = permissions;
  });
  return userWithToken;
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
  app: ApplicationContext,
  opt?: UECreationOptions<T>,
): Partial<T extends true ? UEOverView : UEDetail>;
export function createUE(
  app: ApplicationContext,
  {
    code = 'XX00',
    category = 'CS',
    filiere = 'JSP',
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
    const starVoteCriteria: {
      [key: string]: {
        createdAt: Date;
        value: number;
      }[];
    } = {};
    if (!forOverview && 'workTime' in ue) {
      for (const starVote of ue.starVotes) {
        if (starVote.criterionId in starVoteCriteria)
          starVoteCriteria[starVote.criterionId].push({
            createdAt: starVote.createdAt as Date,
            value: starVote.value,
          });
        else
          starVoteCriteria[starVote.criterionId] = [
            {
              createdAt: starVote.createdAt as Date,
              value: starVote.value,
            },
          ];
      }
    }
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
            starVotes: Object.fromEntries(
              Object.entries(starVoteCriteria).map(([key, entry]) => {
                let coefficients = 0;
                let ponderation = 0;
                for (const { value, createdAt } of entry) {
                  const dt =
                    (starVoteCriteria[key][0].createdAt.getTime() -
                      createdAt.getTime()) /
                    1000;
                  const dp = Math.exp(-dt / 10e7);
                  ponderation += dp * value;
                  coefficients += dp;
                }
                return [key, ponderation / coefficients];
              }),
            ),
          },
    );
  });
  return partialUE;
}

export function makeUserJoinUE(
  app: ApplicationContext,
  user: Partial<User>,
  ue: Partial<UEOverView | UEDetail>,
) {
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

export function createCriterion(
  app: ApplicationContext,
  name = 'testCriterion',
) {
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
  app: ApplicationContext,
  onUE: Partial<UEOverView | UEDetail>,
  user: User,
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
        user,
        onUE.code,
      ),
    );
  });
  return lazyComment;
}

export function createReply(
  app: ApplicationContext,
  user: Partial<User>,
  comment: Partial<UEComment>,
) {
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
