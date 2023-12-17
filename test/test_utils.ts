import { PrismaService } from '../src/prisma/prisma.service';
import { INestApplication } from '@nestjs/common';
import { AuthService } from '../src/auth/auth.service';
import { AuthSignUpDto } from '../src/auth/dto';
import { SelectCriterion } from '../src/ue/interfaces/criterion.interface';
import { SelectUEOverview } from '../src/ue/interfaces/ue-overview.interface';
import { SelectUEDetail } from '../src/ue/interfaces/ue-detail.interface';

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
  } as AuthSignUpDto;
  const userWithToken = { ...user, token: '' };
  beforeAll(async () => {
    userWithToken.token = await app().get(AuthService).signup(user);
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
