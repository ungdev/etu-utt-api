import { User } from '@prisma/client';
import { faker } from '@faker-js/faker';

export function fakeUser(): User {
  return {
    id: faker.datatype.uuid(),
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    studentId: faker.datatype.number(),
    login: faker.datatype.string(),
    RGPDId: faker.datatype.uuid(),
    roles: {},
    hash: '', // TODO : find how to hash the password : etuutt
  };
}