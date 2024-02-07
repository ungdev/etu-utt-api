import { PrismaClient } from '@prisma/client';
import { RawUser } from '../../../src/prisma/types';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcryptjs';

export async function userSeed(): Promise<RawUser[]> {
  console.log('Seeding users...');
  const prisma = new PrismaClient();
  const users: Promise<RawUser>[] = [];
  const fakerRounds = 100;
  const saltRounds = Number.parseInt(process.env.SALT_ROUNDS);
  const hash = await bcrypt.hash('etuutt', saltRounds); // TODO: write this in the docs
  for (let i = 0; i < fakerRounds; i++) {
    users.push(
      prisma.user.create({
        data: {
          firstName: faker.name.firstName(),
          lastName: faker.name.lastName(),
          studentId: faker.datatype.number(),
          login: faker.datatype.string(),
          rgpdId: faker.datatype.uuid(),
          role: 'STUDENT',
          hash,
        },
      }),
    );
  }
  return Promise.all(users);
}
