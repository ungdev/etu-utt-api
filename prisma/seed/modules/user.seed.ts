import { PrismaClient, Sex } from '@prisma/client';
import { RawUser } from '../../../src/prisma/types';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcryptjs';

export async function userSeed(prisma: PrismaClient): Promise<RawUser[]> {
  console.log('Seeding users...');
  const users: Promise<RawUser>[] = [];
  const fakerRounds = 100;
  const saltRounds = Number.parseInt(process.env.SALT_ROUNDS);
  const hash = await bcrypt.hash('etuutt', saltRounds); // TODO: write this in the docs
  for (let i = 0; i < fakerRounds; i++) {
    const firstName = faker.name.firstName();
    const lastName = faker.name.lastName();
    users.push(
      prisma.user.create({
        data: {
          firstName,
          lastName,
          studentId: faker.datatype.number(),
          login: faker.internet.userName(),
          role: 'STUDENT',
          hash,
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
        },
      }),
    );
  }
  return Promise.all(users);
}
