import { UE } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { baseUesCode } from '../../../utils';

export function fakeUE(): UE {
  const date: Date = faker.date.past();
  const code = faker.helpers.arrayElement(baseUesCode) + faker.datatype.number({ min: 1, max: 13 });
  return {
    id: faker.datatype.uuid(),
    //Purely arbitrary values, if you wish to change do not hesitate!
    code,
    inscriptionCode: code,
    name: faker.name.jobTitle(),
    validationRate: faker.datatype.number({ min: 0, max: 100 }),
    createdAt: date,
    updatedAt: date,
  };
}