import { PrismaService } from '../src/prisma/prisma.service';
import { INestApplication } from '@nestjs/common';
import { AuthService } from '../src/auth/auth.service';
import { AuthSignUpDto } from '../src/auth/dto';
import { SelectCriterion } from '../src/ue/interfaces/criterion.interface';
import { SelectUEOverview } from '../src/ue/interfaces/ue-overview.interface';
import { SelectUEDetail } from '../src/ue/interfaces/ue-detail.interface';
import { UEService } from '../src/ue/ue.service';
import { User } from 'src/prisma/types';

export function suite(
  name: string,
  func: (app: () => INestApplication) => void,
) {
  return (app: () => INestApplication) =>
    describe(name, () => {
      beforeAll(async () => {
        await app().get(PrismaService).cleanDb();
      });
      func(app);
    });
}

export function createUser(
  app: () => INestApplication,
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

export async function createUE(
  app: () => INestApplication,
  {
    code = 'XX00',
    category = 'CS',
    filiere = 'JSP',
    branch = 'JSP_BR',
    semester = 'A24',
    forOverview = false,
  } = {},
) {
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
  if (forOverview)
    return app().get(PrismaService).uE.create(SelectUEOverview(data));
  return app().get(PrismaService).uE.create(SelectUEDetail(data));
}

export function makeUserJoinUE(
  app: () => INestApplication,
  userId: string,
  ueCode: string,
) {
  return app()
    .get(PrismaService)
    .userUESubscription.create({
      data: {
        UE: {
          connect: {
            code: ueCode,
          },
        },
        user: {
          connect: {
            id: userId,
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
    });
}

export function createCriterion(
  app: () => INestApplication,
  name = 'testCriterion',
) {
  return app()
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
    );
}

export async function createComment(
  app: () => INestApplication,
  onUECode: string,
  user: User,
  anonymous = false,
) {
  const sub = await app()
    .get(PrismaService)
    .userUESubscription.findFirst({
      where: {
        UE: {
          code: onUECode,
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
          UE: { connect: { code: onUECode } },
          user: { connect: { id: user.id } },
        },
      });
  return app().get(UEService).createComment(
    {
      body: 'TEST',
      isAnonymous: anonymous,
    },
    user,
    onUECode,
  );
}
