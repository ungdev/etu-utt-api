import { User } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

export async function fakeUser(): Promise<User> {
  const saltRounds = 10; // TODO: load it from the environment variables
  const hash = await bcrypt.hash('etuutt', saltRounds); // TODO: write this in the docs
  return {
    id: faker.datatype.uuid(),
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    studentId: faker.datatype.number(),
    login: faker.datatype.string(),
    rgpdId: faker.datatype.uuid(),
    role: 'STUDENT',
    hash,
  };
}
