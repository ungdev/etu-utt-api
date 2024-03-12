import { UTTBranch } from '@prisma/client';
import { faker } from '@faker-js/faker';

export function fakeUttBranch(code, translationId): UTTBranch {
  return {
    code: code,
    name: faker.name.jobTitle(),
    exitSalary: faker.datatype.number({ min: 1000, max: 10000 }),
    employmentRate: faker.datatype.float({ min: 0, max: 100 }),
    CDIRate: faker.datatype.float({ min: 0, max: 100 }),
    abroadEmploymentRate: faker.datatype.float({ min: 0, max: 100 }),
    descriptionTranslationId: translationId,
  };
}
