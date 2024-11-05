import { PrismaClient, Sex } from '@prisma/client';
import { RawUser } from '../../../src/prisma/types';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcryptjs';
import { DEFAULT_APPLICATION } from '../utils';
import { AuthService } from '../../../src/auth/auth.service';

const FAKER_ROUNDS = 100;

export async function userSeed(prisma: PrismaClient): Promise<RawUser[]> {
  console.log('Seeding users...');
  const users: Promise<RawUser>[] = [];
  const saltRounds = Number.parseInt(process.env.SALT_ROUNDS);
  const hash = await bcrypt.hash('etuutt', saltRounds);
  for (let i = 0; i < FAKER_ROUNDS; i++) {
    const firstName = faker.name.firstName();
    const lastName = faker.name.lastName();
    users.push(
      prisma.user.create({
        data: {
          firstName,
          lastName,
          studentId: faker.datatype.number(),
          login: i === 0 ? 'student' : faker.internet.userName(),
          userType: 'STUDENT',
          hash,
          apiKeys: {
            create: {
              token: AuthService.generateToken(),
              tokenUpdatedAt: new Date(),
              application: {
                connect: {
                  id: DEFAULT_APPLICATION,
                },
              },
            },
          },
          rgpd: { create: {} },
          infos: {
            create: {
              sex: faker.helpers.arrayElement(['MALE', 'FEMALE', 'OTHER'] as Sex[]),
              nickname: faker.internet.userName(),
              birthday: faker.date.past(7, new Date(Date.now()).getTime() - 18 * 365 * 24 * 3600),
            },
          },
          mailsPhones: {
            create: {
              mailUTT: faker.internet.email(firstName, lastName, 'utt.fr'),
            },
          },
          preference: { create: {} },
          socialNetwork: { create: {} },
          privacy: { create: {} },
        },
      }),
    );
  }
  return Promise.all(users);
}
